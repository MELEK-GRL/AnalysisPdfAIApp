
const OpenAI = require('openai');

if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY missing');
}
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const DEV = process.env.NODE_ENV !== 'production';
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const TIMEOUT_PRIMARY = DEV ? 20000 : 15000;
const TIMEOUT_SECONDARY = DEV ? 12000 : 10000;
const TIMEOUT_ANALYSIS = DEV ? 12000 : 12000;
const MAX_INPUT_CHARS = 900;
const MAX_ITEMS_FOR_ANALYSIS = 40;

function clamp01(n) {
    const x = Number(n);
    if (!Number.isFinite(x)) return 0;
    if (x < 0) return 0;
    if (x > 1) return 1;
    return x;
}

function coerceAndValidate(payload) {
    const out = {
        isLab: !!payload?.isLab,
        confidence: clamp01(payload?.confidence ?? 0),
        reason: String(payload?.reason ?? ''),
        items: Array.isArray(payload?.items) ? payload.items : [],
    };

    out.items = out.items
        .map((it) => ({
            test: typeof it?.test === 'string' ? it.test.trim() : '',
            label: it?.label == null ? null : String(it.label),
            value: Number(it?.value),
            unit: it?.unit == null ? null : String(it.unit),
            refLow: it?.refLow == null ? null : Number(it.refLow),
            refHigh: it?.refHigh == null ? null : Number(it.refHigh),
        }))
        .filter((it) => it.test && Number.isFinite(it.value));

    return out;
}
function regexExtract(text) {
    if (typeof text !== 'string') return { items: [] };

    const normalize = (s) =>
        String(s)
            .replace(/\u00A0/g, ' ')
            .replace(/[，、]/g, ',')
            .replace(/[–—]/g, '-')
            .replace(/\s+/g, ' ')
            .trim();

    const lines = text.split(/\r?\n/).map(normalize).slice(0, 800);

    const unitRx = /(mg\/dl|mmol\/l|iu\/l|u\/l|ng\/ml|µg\/l|μg\/l|mcg\/l|g\/l|pg\/ml|%|fl|fL|10\^9\/L|10\^3\/µL|μl|µl|ml|l|mm\/h|kat\/l)/i;
    const numRx = /([-+]?\d+(?:[.,]\d+)?)/;
    const rangeRx = /\(?\s*([<>]?\s*\d+(?:[.,]\d+)?)\s*[-–~]\s*([<>]?\s*\d+(?:[.,]\d+)?)\s*\)?/i;

    const items = [];
    let prevLabel = '';

    const push = (test, rawVal, rawUnit, rawLow, rawHigh) => {
        const cleanTest = normalize(test).replace(/\b(Tarih|Tahlil|Sonuç(?: Birimi)?|Referans(?: Değeri)?)\b/gi, '').trim();
        const value = Number(String(rawVal).replace(',', '.'));
        const unit = rawUnit ? String(rawUnit) : null;

        let refLow = null, refHigh = null;
        if (rawLow != null && rawHigh != null) {
            const low = Number(String(rawLow).replace(',', '.').replace(/[<>]\s*/, ''));
            const high = Number(String(rawHigh).replace(',', '.').replace(/[<>]\s*/, ''));
            if (Number.isFinite(low) && Number.isFinite(high) && low <= high) { refLow = low; refHigh = high; }
        }

        if (cleanTest && Number.isFinite(value)) {
            items.push({ test: cleanTest, label: null, value, unit, refLow, refHigh });
        }
    };

    for (const raw of lines) {
        if (!raw) continue;
        const valM = raw.match(numRx);
        if (!valM) {
            if (/[A-Za-zÇÖŞÜĞİıçöşüğ()/%-]{2,}/.test(raw)) prevLabel = raw;
            continue;
        }

        const idx = raw.indexOf(valM[0]);
        let left = raw.slice(0, idx).trim();
        if (left.length < 2 && prevLabel) left = prevLabel;
        if (left.length < 2) { prevLabel = ''; continue; }

        const unitM = raw.slice(idx).match(unitRx);
        const rangeM = raw.match(rangeRx);
        const low = rangeM ? rangeM[1] : null;
        const high = rangeM ? rangeM[2] : null;

        push(left, valM[0], unitM?.[0] || null, low, high);
        prevLabel = '';
        if (items.length >= 80) break;
    }

    if (items.length === 0) {
        const all = normalize(text);
        const globalRx =
            /([A-Za-zÇÖŞÜĞİıçöşüğ()\/.%\-\s]{2,}?)\s+([-+]?\d+(?:[.,]\d+)?)\s*(mg\/dl|mmol\/l|iu\/l|u\/l|ng\/ml|µg\/l|μg\/l|mcg\/l|g\/l|pg\/ml|%|fl|fL|10\^9\/L|10\^3\/µL|μl|µl|ml|l|mm\/h|kat\/l)?(?:\s*[,;]?\s*(?:ref\.?|referans)?\s*:?\s*\(?\s*([<>]?\s*\d+(?:[.,]\d+)?)\s*[-–~]\s*([<>]?\s*\d+(?:[.,]\d+)?)\s*\)?)?/gi;

        let m;
        while ((m = globalRx.exec(all))) {
            const [, test, value, unit, low, high] = m;
            push(test, value, unit, low, high);
            if (items.length >= 80) break;
        }
    }

    return { items };
}

function reduceToLikelyLabLines(text) {
    if (typeof text !== 'string') return '';
    const lines = text.split(/\r?\n/);

    const keepRx = /[A-Za-zÇÖŞÜĞİıçöşüğ\-\/() ]{2,}\s+[<>≈~]?\s*\d/;
    const kept = lines.filter(l => keepRx.test(l));

    const trimmed = kept.map(l =>
        l.replace(/\u00A0/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
    ).filter(Boolean).slice(0, 120);

    const joined = trimmed.join('\n');

    return joined.length > MAX_INPUT_CHARS ? joined.slice(0, MAX_INPUT_CHARS) : joined || text.slice(0, MAX_INPUT_CHARS);
}


function withTimeout(promise, ms, label = 'operation') {
    let t;
    const timer = new Promise((_, rej) => {
        t = setTimeout(() => rej(new Error(`${label} timeout after ${ms}ms`)), ms);
    });
    return Promise.race([promise, timer]).finally(() => clearTimeout(t));
}

function extractOutputText(resp) {
    if (resp?.output_text && typeof resp.output_text === 'string') return resp.output_text;
    try {
        const node = resp.output?.[0]?.content?.find?.((c) => c?.type === 'output_text');
        if (node?.text) return String(node.text);
    } catch (_) { }
    return '';
}

function tryParseJSON(s) {
    if (typeof s !== 'string') return null;
    const fenced = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    const body = fenced ? fenced[1] : s;
    try { return JSON.parse(body); } catch (_) { }

    const start = body.indexOf('{');
    const end = body.lastIndexOf('}');
    if (start >= 0 && end > start) {
        try { return JSON.parse(body.slice(start, end + 1)); } catch (_) { }
    }
    return null;
}

const LAB_EXTRACTION_FORMAT = {
    type: 'json_schema',
    name: 'LabExtraction',
    strict: true,
    schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
            isLab: { type: 'boolean' },
            confidence: { type: 'number', minimum: 0, maximum: 1 },
            reason: { type: 'string' },
            items: {
                type: 'array',
                items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        test: { type: 'string' },
                        label: { type: ['string', 'null'] },
                        value: { type: 'number' },
                        unit: { type: ['string', 'null'] },
                        refLow: { type: ['number', 'null'] },
                        refHigh: { type: ['number', 'null'] },
                    },
                    required: ['test', 'label', 'value', 'unit', 'refLow', 'refHigh'],
                },
            },
        },
        required: ['isLab', 'confidence', 'reason', 'items'],
    },
};




async function callOpenAI({ instructions, input, timeoutMs = TIMEOUT_PRIMARY, model = MODEL }) {
    const resp = await withTimeout(
        openai.responses.create({
            model,
            instructions: `${instructions}\n\nIMPORTANT: Output valid JSON matching the schema.`,
            input: `TEXT:\n${input}\n\nReturn only JSON.`,
            text: { format: LAB_EXTRACTION_FORMAT },
        }),
        timeoutMs,
        'openai.responses.create'
    );

    const raw = extractOutputText(resp);
    const parsed = tryParseJSON(raw);
    if (!parsed || typeof parsed !== 'object') {
        return { isLab: false, confidence: 0, reason: 'Malformed JSON from model', items: [] };
    }
    return coerceAndValidate(parsed);
}

function itemsToBulletedText(items) {
    return items
        .slice(0, MAX_ITEMS_FOR_ANALYSIS)
        .map((it) => {
            const parts = [];
            parts.push(it.test);
            parts.push(`değer: ${it.value}${it.unit ? ' ' + it.unit : ''}`);
            if (Number.isFinite(it.refLow) && Number.isFinite(it.refHigh)) {
                parts.push(`ref: ${it.refLow}–${it.refHigh}${it.unit ? ' ' + it.unit : ''}`);
            }
            return `- ${parts.join(' | ')}`;
        })
        .join('\n');
}

async function generateAnalysisText(items) {
    if (!Array.isArray(items) || items.length === 0) {
        return defaultAnalysisFallback();
    }

    const bullet = itemsToBulletedText(items);

    const systemInstr = `
Sen bir klinik asistan değilsin; **tıbbi tanı koymazsın**. Kullanıcıya bilgilendirici ve sade Türkçe bir özet yaz.
ÇIKTIYI SADECE MARKDOWN OLARAK VER. Aşağıdaki 4 bölümü bu sırada üret:
1) **Tahlil Özeti**: Bulguların genel çerçevesi (kısa).
2) **Öne Çıkan Bulgular**: Referans dışına çıkan veya klinik açıdan anlamlı maddeleri madde işaretli listele (varsa).
3) **Tavsiye**: Yaşam tarzı/izlem önerileri (genel, tıbbi tedavi önermeden).
4) **Uyarı**: “Bu bir tıbbi değerlendirme değildir, sonuçları doktorunuzla paylaşın.” gibi net bir uyarı.

Kısıtlar:
- **İlaç ismi, doz, tanı** verme.
- Belirsiz durumda “ek klinik bağlam gerekir” de.
- Ton: sakin, yargısız, sade.
`;

    const userInput = `
Aşağıda kullanıcının laboratuvar maddeleri var (madde madde). Buna göre yukarıdaki 4 başlıkta kısa bir değerlendirme yaz.
Veriler:
${bullet}
`;

    try {
        const resp = await withTimeout(
            openai.responses.create({
                model: MODEL,
                instructions: systemInstr,
                input: userInput,

            }),
            TIMEOUT_ANALYSIS,
            'openai.responses.create (analysis)'
        );

        const text = extractOutputText(resp)?.trim();
        if (!text) return defaultAnalysisFallback();
        return hardenWithDisclaimer(text);
    } catch (e) {
        console.warn('OPENAI ANALYSIS ERR:', e?.message || e);
        return defaultAnalysisFallback();
    }
}

function hardenWithDisclaimer(markdown) {
    const warning =
        '\n\n---\n**Uyarı:** Bu içerik tıbbi tavsiye değildir. Sonuçlarınızı semptomlarınız ve öykünüzle birlikte **doktorunuza** danışın.';
    const low = markdown.toLowerCase();
    if (low.includes('tıbbi tavsiye değildir') || low.includes('doktorunuza')) {
        return markdown;
    }
    return `${markdown}\n${warning}`;
}

function defaultAnalysisFallback() {
    return [
        '### Tahlil Özeti',
        'Veriler sınırlı veya standart biçimde değil; yine de genel bir değerlendirme için doktorunuzun dosyayı görmesi en doğrusu olacaktır.',
        '',
        '### Öne Çıkan Bulgular',
        '- Bu ön izleme, referans dışı değerleri kesin olarak belirlemeyebilir.',
        '',
        '### Tavsiye',
        '- Dengeli beslenme, yeterli su tüketimi, düzenli uyku ve hafif/orta şiddette aktivite genel sağlığı destekler.',
        '',
        '---',
        '**Uyarı:** Bu içerik tıbbi tavsiye değildir. Sonuçlarınızı semptomlarınız ve öykünüzle birlikte **doktorunuza** danışın.',
    ].join('\n');
}

async function classifyAndExtract(text) {
    const baseInstr = `You receive text extracted from a PDF... (aynı içerik)`;
    const reduced = reduceToLikelyLabLines(text || '');
    const clipped = reduced.length > MAX_INPUT_CHARS ? reduced.slice(0, MAX_INPUT_CHARS) : reduced;

    const local0 = regexExtract(text || '');
    const regexLikely = (local0.items?.length || 0) >= 3;

    console.log('[OPENAI] model=', MODEL, 'len=', clipped.length, 'dev=', DEV);

    try {
        const r1 = await callOpenAI({
            instructions: baseInstr,
            input: `TEXT:\n${clipped}`,
            timeoutMs: TIMEOUT_PRIMARY,
        });

        if (r1.isLab && r1.confidence >= 0.6) {
            const analysis = await generateAnalysisText(r1.items);
            return { ...r1, analysis };
        }

        if ((!r1.isLab || r1.confidence < 0.6) && regexLikely) {
            const merged = {
                isLab: true,
                confidence: Math.max(0.35, r1.confidence || 0.35),
                reason: 'Regex heuristic override (LLM unsure/negative)',
                items: local0.items,
            };
            const analysis = await generateAnalysisText(merged.items);
            return { ...merged, analysis };
        }

        if (r1.isLab) {
            const analysis = await generateAnalysisText(r1.items);
            return { ...r1, analysis };
        }

        return r1;
    } catch (e) {
        console.warn('OPENAI TRY1 ERR:', e?.message || e);
    }

    try {
        const r2 = await callOpenAI({
            instructions: 'Output ONLY the JSON as previously described.',
            input: clipped.slice(0, Math.min(2000, clipped.length)),
            timeoutMs: TIMEOUT_SECONDARY,
        });

        if (r2.isLab && r2.confidence >= 0.6) {
            const analysis = await generateAnalysisText(r2.items);
            return { ...r2, analysis };
        }

        if ((!r2.isLab || r2.confidence < 0.6) && regexLikely) {
            const merged = {
                isLab: true,
                confidence: Math.max(0.35, r2.confidence || 0.35),
                reason: 'Regex heuristic override (LLM unsure/negative)',
                items: local0.items,
            };
            const analysis = await generateAnalysisText(merged.items);
            return { ...merged, analysis };
        }

        if (r2.isLab) {
            const analysis = await generateAnalysisText(r2.items);
            return { ...r2, analysis };
        }

        return r2;
    } catch (e) {
        console.warn('OPENAI TRY2 ERR:', e?.message || e);
    }

    const local = local0;
    const isLab = (local.items?.length || 0) > 0;
    const fallback = {
        isLab,
        confidence: isLab ? 0.35 : 0,
        reason: isLab ? 'Local regex extraction (LLM timeout)' : 'LLM timeout',
        items: local.items || [],
    };

    const analysis = isLab ? await generateAnalysisText(fallback.items) : defaultAnalysisFallback();
    return { ...fallback, analysis };
}

module.exports = { classifyAndExtract };

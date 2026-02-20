
const OpenAI = require('openai');

if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY missing');
}
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const DEV = process.env.NODE_ENV !== 'production';
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const TIMEOUT_PRIMARY = DEV ? 50000 : 25000;
const TIMEOUT_SECONDARY = DEV ? 35000 : 20000;
const TIMEOUT_ANALYSIS = DEV ? 12000 : 12000;
const MAX_INPUT_CHARS = 2800;
const MAX_INPUT_CHARS_FIRST_TRY = 2400;
const MAX_ITEMS_FOR_ANALYSIS = 40;

function clamp01(n) {
    const x = Number(n);
    if (!Number.isFinite(x)) return 0;
    if (x < 0) return 0;
    if (x > 1) return 1;
    return x;
}

/** Parse numeric value from PDF/API: accept number or string (e.g. "12,5" or "12.5"). */
function parseLabNumber(v) {
    if (v == null) return null;
    if (Number.isFinite(Number(v))) return Number(v);
    const s = String(v).trim().replace(/\s/g, '').replace(',', '.');
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
}

/** PDF üst/alt bilgisi veya metadata'dan gelen tahlil olmayan alanları eler (örn. Sayfa, enabiz.gov.tr, HPF, bakanlık başlığı). */
function isJunkLabLabel(test) {
    if (typeof test !== 'string') return true;
    const t = test.trim();
    if (!t || t.length < 2) return true;
    if (/^(Sayfa|Page)\s*\d*$/i.test(t)) return true;
    if (/^Analiz$/i.test(t) || /^HPF$/i.test(t)) return true;
    if (/\.(gov|tr|com|net|org)\b/i.test(t) || /^https?:\/\//i.test(t) || /^www\./i.test(t)) return true;
    if (/^Değeri$/i.test(t)) return true;
    if (/CKD-EPI formülüne göre|formülüne göre hesaplanmıştır/i.test(t)) return true;
    if (/T\.C\.|SAĞLIK BAKANLIĞI|Genel Müdürlük|Adı\/Soyadı|Cinsiyet\s*:|Doğum tarihi|Sağlık Bilgi Sistemleri/i.test(t)) return true;
    if (/ÖZEL\s+[A-ZİĞÜŞÖÇ]+\s+HASTANESİ|MEDİCALPARK|TarihTahlilSonuç|Tarih\s*Tahlil\s*Sonuç/i.test(t)) return true;
    if (t.length > 80 && /bakanlık|müdürlük|sistemleri|adı\s*\/\s*soyadı|cinsiyet|hastanesi/i.test(t)) return true;
    return false;
}

function coerceAndValidate(payload) {
    const out = {
        isLab: !!payload?.isLab,
        confidence: clamp01(payload?.confidence ?? 0),
        reason: String(payload?.reason ?? ''),
        items: Array.isArray(payload?.items) ? payload.items : [],
    };

    out.items = out.items
        .map((it) => {
            let unit = it?.unit == null ? null : String(it.unit).trim();
            if (unit === '' || unit === 'null' || (unit != null && unit.toLowerCase() === 'undefined')) unit = null;
            let refLow = parseLabNumber(it?.refLow);
            let refHigh = parseLabNumber(it?.refHigh);
            if (refLow != null && refHigh != null && refLow > refHigh) {
                [refLow, refHigh] = [refHigh, refLow];
            }
            if (refLow === 0 && refHigh === 0) {
                refLow = null;
                refHigh = null;
            }
            const value = parseLabNumber(it?.value);
            let resultLabel = it?.resultLabel != null ? String(it.resultLabel).trim() : null;
            if (resultLabel === '' || (resultLabel != null && resultLabel.toLowerCase() === 'null')) resultLabel = null;
            let label = it?.label == null ? null : String(it.label).trim();
            if (label && /^(%|mg\/dl|mmol\/l|g\/l|u\/l|k\/ul|fl|pg|sn)$/i.test(label)) label = null;
            return {
                test: typeof it?.test === 'string' ? it.test.trim() : '',
                label: label || null,
                value: value != null ? value : NaN,
                unit,
                refLow,
                refHigh,
                resultLabel: resultLabel || null,
            };
        })
        .filter((it) => it.test && Number.isFinite(it.value) && !isJunkLabLabel(it.test));

    out.items = out.items.map((it) => {
        const v = it.value;
        if (!Number.isFinite(v)) return it;
        if (it.test === 'Serbest T') {
            if (v >= 30 && v < 40) return { ...it, test: 'Serbest T3', value: Math.round((v - 30) * 100) / 100 };
            if (v >= 40 && v < 50) return { ...it, test: 'Serbest T4', value: Math.round((v - 40) * 100) / 100 };
            return it;
        }
        if (it.test === 'Serbest T3' && v >= 30 && v < 40) return { ...it, value: Math.round((v - 30) * 100) / 100 };
        if (it.test === 'Serbest T4' && v >= 40 && v < 50) return { ...it, value: Math.round((v - 40) * 100) / 100 };
        return it;
    });

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

    const normalizedText = normalize(text).replace(/\b(Serbest T)3\b/gi, '$1³').replace(/\b(Serbest T)4\b/gi, '$1⁴');
    const lines = normalizedText.split(/\r?\n/).slice(0, 800);

    const unitRx = /(mg\/dl|mmol\/l|iu\/l|u\/l|ng\/ml|µg\/l|μg\/l|mcg\/l|g\/l|pg\/ml|%|fl|fL|10\^9\/L|10\^3\/µL|μl|µl|ml|l|mm\/h|kat\/l|HPF|BIRIM)/i;
    const numRx = /([-+]?\d+(?:[.,]\d+)?)/;
    const rangeRx = /\(?\s*([<>]?\s*\d+(?:[.,]\d+)?)\s*[-–~]\s*([<>]?\s*\d+(?:[.,]\d+)?)\s*\)?/i;

    const items = [];
    let prevLabel = '';

    const push = (test, rawVal, rawUnit, rawLow, rawHigh, resultLabel = null) => {
        let cleanTest = normalize(test).replace(/\b(Tarih|Tahlil|Sonuç(?: Birimi)?|Referans(?: Değeri)?)\b/gi, '').trim();
        cleanTest = cleanTest.replace(/³/g, '3').replace(/⁴/g, '4');
        const value = Number(String(rawVal).replace(',', '.'));
        const unit = rawUnit ? String(rawUnit) : null;

        let refLow = null, refHigh = null;
        if (rawLow != null && rawHigh != null) {
            const low = Number(String(rawLow).replace(',', '.').replace(/[<>]\s*/, ''));
            const high = Number(String(rawHigh).replace(',', '.').replace(/[<>]\s*/, ''));
            if (Number.isFinite(low) && Number.isFinite(high) && low <= high) { refLow = low; refHigh = high; }
        }

        if (cleanTest && Number.isFinite(value) && !isJunkLabLabel(cleanTest)) {
            items.push({ test: cleanTest, label: null, value, unit, refLow, refHigh, resultLabel });
        }
    };

    for (const raw of lines) {
        if (!raw) continue;
        const allNumMatches = [];
        let numM;
        const numRxG = new RegExp(numRx.source, 'g');
        while ((numM = numRxG.exec(raw)) !== null) {
            allNumMatches.push({ val: numM[0], index: numM.index });
        }
        if (allNumMatches.length === 0) {
            if (/[A-Za-zÇÖŞÜĞİıçöşüğ()/%-]{2,}/.test(raw)) prevLabel = raw;
            continue;
        }

        let valM = null;
        for (const m of allNumMatches) {
            const after = raw.slice(m.index + m.val.length, m.index + m.val.length + 3);
            const before = raw.slice(Math.max(0, m.index - 2), m.index);
            if (/^\/\d/.test(after)) continue;
            if (/\/\d*$/.test(before)) continue;
            valM = { 0: m.val, index: m.index };
            break;
        }
        if (!valM) continue;

        const idx = valM.index;
        let left = raw.slice(0, idx).trim();
        if (left.length < 2 && prevLabel) left = prevLabel;
        if (left.length < 2) { prevLabel = ''; continue; }

        const unitM = raw.slice(idx).match(unitRx);
        const rangeM = raw.match(rangeRx);
        const low = rangeM ? rangeM[1] : null;
        const high = rangeM ? rangeM[2] : null;
        const statusMatch = raw.match(/\b(Negatif|Pozitif|Reaktif|Negative|Positive)\b/i);
        const resultLabel = statusMatch ? statusMatch[1] : null;

        push(left, valM[0], unitM?.[0] || null, low, high, resultLabel);
        prevLabel = '';
        if (items.length >= 80) break;
    }

    if (items.length === 0) {
        const all = normalizedText;
        const globalRx =
            /([A-Za-zÇÖŞÜĞİıçöşüğ()\/.%\-\s]{2,}?)\s+([-+]?\d+(?:[.,]\d+)?)\s*(mg\/dl|mmol\/l|iu\/l|u\/l|ng\/ml|µg\/l|μg\/l|mcg\/l|g\/l|pg\/ml|%|fl|fL|10\^9\/L|10\^3\/µL|μl|µl|ml|l|mm\/h|kat\/l|HPF|BIRIM)?(?:\s*[,;]?\s*(?:ref\.?|referans)?\s*:?\s*\(?\s*([<>]?\s*\d+(?:[.,]\d+)?)\s*[-–~]\s*([<>]?\s*\d+(?:[.,]\d+)?)\s*\)?)?/gi;

        let m;
        while ((m = globalRx.exec(all))) {
            const [, test, value, unit, low, high] = m;
            const statusMatch = m[0].match(/\b(Negatif|Pozitif|Reaktif|Negative|Positive)\b/i);
            push(test, value, unit, low, high, statusMatch ? statusMatch[1] : null);
            if (items.length >= 80) break;
        }
    }

    return { items };
}

function reduceToLikelyLabLines(text) {
    if (typeof text !== 'string') return '';
    const lines = text.split(/\r?\n/);

    const keepRx = /[A-Za-zÇÖŞÜĞİıçöşüğ\-\/() ]{2,}\s+[<>≈~]?\s*\d/;
    const rangeRx = /\d+(?:[.,]\d+)?\s*[-–~]\s*\d+(?:[.,]\d+)?/;
    const kept = lines.filter(l => keepRx.test(l) || rangeRx.test(l));

    const trimmed = kept.map(l =>
        l.replace(/\u00A0/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
    ).filter(Boolean).slice(0, 120);

    const joined = trimmed.join('\n');

    return joined.length > MAX_INPUT_CHARS ? joined.slice(0, MAX_INPUT_CHARS) : joined || text.slice(0, MAX_INPUT_CHARS);
}

const LAB_KEYWORDS = /referans|mg\/dl|mmol|tahlil|HGB|glukoz|glucose|WBC|RBC|hemoglobin|AKŞ|üre|kreatinin|TSH|ALT|AST|bilirubin|kolesterol|trigliserid|HDL|LDL|hemogram|biyokimya|idrar|kan\s*tahlil|HCT|MCV|MCH|PLT|Lökosit|Eritrosit|sonuç|değer|result|lab|parametre/i;

/** Son çare: metin tahlil gibi görünüyorsa çok esnek satır eşlemesi ile item üret (LLM timeout + regex 0 item için). */
function permissiveLabExtract(text) {
    if (typeof text !== 'string' || text.length < 150) return { items: [] };
    const hasLabTerm = LAB_KEYWORDS.test(text);
    const hasRangeOrUnit = /\d+(?:[.,]\d+)?\s*[-–~]\s*\d+(?:[.,]\d+)?|mg\/dl|mmol\/l|referans|%\s*\d|\d+\s*%/.test(text);
    const hasNumbers = (text.match(/\d+(?:[.,]\d+)?/g) || []).length >= 3;
    if (!hasLabTerm && !hasNumbers) return { items: [] };
    if (!hasRangeOrUnit && !hasNumbers) return { items: [] };

    const lines = text.split(/\r?\n/).map(l => l.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean);
    const items = [];
    const nameNumRx = /^([A-Za-zÇÖŞÜĞİıçöşüğ\-\/()%\s]{2,}?)\s+([<>]?\s*\d+(?:[.,]\d+)?)\s*(.*)$/;
    const numNameRx = /^([<>]?\s*\d+(?:[.,]\d+)?)\s+([A-Za-zÇÖŞÜĞİıçöşüğ\-\/()%\s]{2,}?)\s*(.*)$/;
    const rangeRx = /([<>]?\s*\d+(?:[.,]\d+)?)\s*[-–~]\s*([<>]?\s*\d+(?:[.,]\d+)?)/;

    for (const line of lines) {
        let test = null, value = null, rest = '';
        let m = line.match(nameNumRx);
        if (m) {
            [, test, value, rest] = m;
            value = Number(String(value).replace(',', '.').replace(/[<>]\s*/, ''));
        } else {
            m = line.match(numNameRx);
            if (m) {
                [, value, test, rest] = m;
                value = Number(String(value).replace(',', '.').replace(/[<>]\s*/, ''));
            }
        }
        if (test == null || value == null || !Number.isFinite(value)) continue;
        test = test.trim();
        if (!test || test.length < 2 || isJunkLabLabel(test)) continue;
        let refLow = null, refHigh = null, unit = null;
        const rangeM = (line + ' ' + rest).match(rangeRx);
        if (rangeM) {
            refLow = Number(String(rangeM[1]).replace(',', '.').replace(/[<>]\s*/, ''));
            refHigh = Number(String(rangeM[2]).replace(',', '.').replace(/[<>]\s*/, ''));
            if (!Number.isFinite(refLow) || !Number.isFinite(refHigh) || refLow > refHigh) refLow = refHigh = null;
        }
        if (/(mg\/dl|mmol\/l|g\/l|%|fl|u\/l|iu\/l|ml)/i.test(rest)) unit = rest.match(/(mg\/dl|mmol\/l|g\/l|%|fl|u\/l|iu\/l|ml\/?[\w]*)/i)?.[0] || null;
        items.push({ test, label: null, value, unit, refLow, refHigh, resultLabel: null });
        if (items.length >= 80) break;
    }
    return { items };
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
                        resultLabel: { type: ['string', 'null'] },
                    },
                    required: ['test', 'label', 'value', 'unit', 'refLow', 'refHigh', 'resultLabel'],
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
Sen bir klinik asistan değilsin; **tıbbi tanı koymazsın**. Sadece verilen laboratuvar verilerine dayanarak bilgilendirici ve sade Türkçe bir özet yaz. **Sadece aşağıda verilen parametrelerin adı, değeri ve referans aralığına göre yorum yap.** Veride olmayan bir şey ekleme veya varsayma.
ÇIKTIYI SADECE MARKDOWN OLARAK VER. Aşağıdaki 4 bölümü bu sırada üret:
1) **Tahlil Özeti**: Verilen değerlerin genel çerçevesi (kısa).
2) **Öne Çıkan Bulgular**: Referans dışına çıkan maddeleri, verideki parametre adı ve değeriyle madde işaretli listele (varsa).
3) **Tavsiye**: Yaşam tarzı/izlem önerileri (genel, tıbbi tedavi önermeden).
4) **Uyarı**: “Bu bir tıbbi değerlendirme değildir, sonuçları doktorunuzla paylaşın.” gibi net bir uyarı.

Kısıtlar:
- **İlaç ismi, doz, tanı** verme.
- Belirsiz durumda “ek klinik bağlam gerekir” de.
- Yorumu yalnızca verilen liste üzerinden yap; listede olmayan parametre veya değer yazma.
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
    if (markdown == null || typeof markdown !== 'string') return markdown || '';
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

const LAB_EXTRACTION_INSTRUCTIONS = `You receive text extracted from a PDF. Your job is to accept ONLY medical laboratory test reports (tahlil raporu / lab report).

CRITICAL – Set isLab: false for anything that is NOT a medical lab report. Examples that must be isLab: false:
- CV, resume, öz geçmiş, curriculum vitae (even if they contain numbers or years like 2023, 2025)
- Certificates, diplomas, cover letters
- General documents, invoices, forms
- Any text without clear medical lab parameters (e.g. HGB, glucose, creatinine, WBC, RBC, referans aralığı, tahlil sonucu)

Set isLab: true ONLY when the document is clearly a medical laboratory result report: patient lab values with parameter names, numeric results, units (mg/dl, mmol/L, etc.) and reference ranges. Typical content: hemogram, biyokimya, idrar tahlili, kan tahlili, etc.

Your task:
1. Decide if the text is a lab report (isLab: true) or not. When in doubt or for CVs/resumes/certificates, use isLab: false.
2. For each lab test row you find (only when isLab is true), extract EXACTLY as written in the PDF:
   - test: the parameter name exactly as in the document (e.g. "Yassı Epitel", "HCT", "HGB")
   - value: the patient's numeric result EXACTLY as shown (same number, use decimal point; e.g. 0.10, 12.5, 140). Do not use numbers that are part of the test name (e.g. in "HIV 1/2" the 1 and 2 are not the result—the result is the separate number such as 0.10). Do not round or approximate.
   - unit: if present, exactly as written (e.g. HPF, %, mg/dl, g/dl, BIRIM)
   - refLow and refHigh: the reference range for this parameter only. If the PDF shows a range next to this test (e.g. "Amilaz: 56 IU/L (28 - 100)"), set refLow and refHigh to that range (28 and 100). If the PDF does not show a range for this row, use null for both. Never use another parameter's reference range: each row must have only the ref that belongs to that test in the PDF.
3. Copy every lab parameter you can identify with its value and reference range. Do not skip rows. Do not alter or interpret values—extract them literally.
4. When the PDF explicitly states a result status for a test (e.g. "Negatif", "Pozitif", "Reaktif", "Negative", "Positive"), put that exact word in resultLabel for that item; otherwise use null. This is important for screening tests (HIV, HBsAg, Anti HCV, etc.).
5. Ignore headers, footers, page numbers, and URLs (e.g. enabiz.gov.tr).`;

async function classifyAndExtract(text) {
    const baseInstr = LAB_EXTRACTION_INSTRUCTIONS;
    const reduced = reduceToLikelyLabLines(text || '');
    const clipped = reduced.length > MAX_INPUT_CHARS ? reduced.slice(0, MAX_INPUT_CHARS) : reduced;

    let local0 = regexExtract(text || '');
    let permissiveCount = 0;
    if ((local0.items?.length || 0) === 0 && reduced.length > 100) {
        const fromReduced = regexExtract(reduced);
        if ((fromReduced.items?.length || 0) > 0) local0 = fromReduced;
    }
    if ((local0.items?.length || 0) === 0) {
        const fromPermissive = permissiveLabExtract(text || '');
        permissiveCount = fromPermissive.items?.length || 0;
        if (permissiveCount >= 1) local0 = fromPermissive;
    }
    const regexLikely = (local0.items?.length || 0) >= 3;

    const clippedFirst = clipped.length > MAX_INPUT_CHARS_FIRST_TRY ? clipped.slice(0, MAX_INPUT_CHARS_FIRST_TRY) : clipped;
    try {
        const r1 = await callOpenAI({
            instructions: baseInstr,
            input: `TEXT:\n${clippedFirst}`,
            timeoutMs: TIMEOUT_PRIMARY,
        });

        if (r1.isLab && r1.confidence >= 0.6) {
            const analysis = await generateAnalysisText(r1.items);
            return { ...r1, analysis };
        }

        /* Only override when LLM said it IS lab but was unsure; never force lab when LLM said not lab (e.g. CV). */
        if (r1.isLab && r1.confidence < 0.6 && regexLikely) {
            const merged = {
                isLab: true,
                confidence: Math.max(0.35, r1.confidence || 0.35),
                reason: 'Regex heuristic override (LLM unsure)',
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

        if (r2.isLab && r2.confidence < 0.6 && regexLikely) {
            const merged = {
                isLab: true,
                confidence: Math.max(0.35, r2.confidence || 0.35),
                reason: 'Regex heuristic override (LLM unsure)',
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

    /* On LLM timeout: do not treat as lab from regex alone – CVs can match numbers. Prefer non-lab. */
    const local = local0;
    const items = local.items || [];
    if (process.env.NODE_ENV !== 'production') {
        console.log('[LAB_FALLBACK] textLen=', (text || '').length, 'regexItems=', items.length, 'reducedLen=', reduced.length, 'permissiveTried=', permissiveCount);
    }
    const hasManyLabLikeItems = items.length >= 5 || items.length >= 1;
    const hasExplicitMedicalUnits = items.some(
        (it) => it?.unit && /(mg\/dl|mmol\/l|g\/l|%|fl|HPF|10\^9|referans)/i.test(String(it.unit))
    );
    const refCount = items.filter((it) => it?.refLow != null && it?.refHigh != null).length;
    const hasRefRanges = refCount >= (items.length >= 5 ? 2 : 1);
    const hasTruncatedUnits = items.length >= 10 && items.some((it) => it?.unit && String(it.unit).trim().length > 0);
    const hasMedicalUnits = hasExplicitMedicalUnits || hasRefRanges || hasTruncatedUnits;
    const isLab = items.length >= 1 && hasMedicalUnits;
    const rawItems = local.items || [];
    const filteredItems = rawItems.filter(
        (it) =>
            it?.test &&
            !isJunkLabLabel(it.test) &&
            !(it.test.trim() === 'HIV' && it.value === 1)
    );
    const txt = text || '';
    const textLooksLikeLab =
        txt.length >= 200 &&
        LAB_KEYWORDS.test(txt) &&
        (/\d+(?:[.,]\d+)?\s*[-–~]\s*\d+(?:[.,]\d+)?|mg\/dl|mmol\/l|referans|\d+(?:[.,]\d+)/i.test(txt));
    const isLabFinal = filteredItems.length >= 1 || (filteredItems.length === 0 && textLooksLikeLab);
    const fallback = {
        isLab: isLabFinal,
        confidence: isLabFinal ? 0.35 : 0,
        reason: isLabFinal ? 'Local regex extraction (LLM timeout)' : 'LLM timeout – not treated as lab',
        items: isLabFinal ? filteredItems : [],
    };

    const analysis = fallback.isLab ? await generateAnalysisText(fallback.items) : defaultAnalysisFallback();
    return { ...fallback, analysis };
}

module.exports = { classifyAndExtract };

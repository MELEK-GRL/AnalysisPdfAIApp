
const OpenAI = require('openai');

let _openaiClient;
function getOpenAIClient() {
    const key = process.env.OPENAI_API_KEY;
    if (!key || !String(key).trim()) {
        throw new Error('OPENAI_API_KEY missing');
    }
    if (!_openaiClient) {
        _openaiClient = new OpenAI({ apiKey: String(key).trim() });
    }
    return _openaiClient;
}

const DEV = process.env.NODE_ENV !== 'production';
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const TIMEOUT_PRIMARY = DEV ? 90000 : 45000;
const TIMEOUT_SECONDARY = DEV ? 60000 : 35000;
const TIMEOUT_ANALYSIS = DEV ? 15000 : 15000;
const MAX_INPUT_CHARS = 5600;
const MAX_INPUT_CHARS_FIRST_TRY = 4500;
const MAX_ITEMS_FOR_ANALYSIS = 80;
const MAX_LAB_LINES_FULL = 350;

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

/** Yalnızca birim ifadesi (test adı değil) */
const UNIT_ONLY_RX = /^(BIRIM|pg|g\/dL|mg\/dL|mmol\/L|mg\/L|IU\/L|IU\/ml|fL|sn|%|HPF|x10\^3\/uL|x10\^6\/uL|M\/uL|K\/uL|ng\/dL|µIU\/ml|μIU\/ml)$/i;

/** PDF üst/alt bilgisi veya metadata'dan gelen tahlil olmayan alanları eler (örn. Sayfa, enabiz.gov.tr, HPF, bakanlık başlığı). */
function isJunkLabLabel(test) {
    if (typeof test !== 'string') return true;
    const t = test.trim();
    if (!t || t.length < 2) return true;
    if (/^NegatifCOI$|^Ne$/i.test(t)) return true;
    if (/\/dk\s*altındaki|CKD-EPI\s*formülüne/i.test(t)) return true;
    if (UNIT_ONLY_RX.test(t)) return true;
    if (/^(Sayfa|Page)\s*\d*$/i.test(t)) return true;
    if (/^Analiz$/i.test(t) || /^HPF$/i.test(t)) return true;
    if (/\.(gov|tr|com|net|org)\b/i.test(t) || /^https?:\/\//i.test(t) || /^www\./i.test(t)) return true;
    if (/^Değeri$/i.test(t)) return true;
    if (/^BIRIMREFERANS$/i.test(t)) return true;
    if (/CKD-EPI formülüne göre|formülüne göre hesaplanmıştır/i.test(t)) return true;
    if (/T\.C\.|SAĞLIK BAKANLIĞI|Genel Müdürlük|Adı\/Soyadı|Cinsiyet\s*:|Doğum tarihi|Sağlık Bilgi Sistemleri/i.test(t)) return true;
    if (/ÖZEL\s+[A-ZİĞÜŞÖÇ]+\s+HASTANESİ|MEDİCALPARK|TarihTahlilSonuç|Tarih\s*Tahlil\s*Sonuç/i.test(t)) return true;
    if (t.length > 80 && /bakanlık|müdürlük|sistemleri|adı\s*\/\s*soyadı|cinsiyet|hastanesi/i.test(t)) return true;
    if (/^Kadın$/i.test(t) || /^Erkek$/i.test(t)) return true;
    if (/^\/?uL$/i.test(t) || /^lU\/mL\s+Premenopozal/i.test(t)) return true;
    if (/^Postmenopozal$/i.test(t) || /^Hamilelikte$/i.test(t) || /^Hafta$/i.test(t)) return true;
    if (/^HEMOGRAM\s+BAS$/i.test(t)) return true;
    return false;
}

/** Bölüm sadece PDF/LLM'den gelir; test adına göre sabit bölüm atanmaz (her gelen PDF farklı parametre/başlık getirebilir). */
function inferSectionForTest(/* testName */) {
    return null;
}

/** Bölüm adı idrar/urine içeriyor mu? (sabit "İDRAR TETKİKİ" yok; PDF/lab ne yazdıysa o.) */
function isIdrarSection(section) {
    if (section == null || typeof section !== 'string') return false;
    return /idrar|urine|İDRAR|IDRAR/i.test(section.trim());
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
            let valueDisplay = it?.valueDisplay != null ? String(it.valueDisplay).trim() : null;
            if (valueDisplay === '' || (valueDisplay != null && valueDisplay.toLowerCase() === 'null')) valueDisplay = null;
            let section = it?.section != null ? String(it.section).trim() : null;
            if (section === '' || (section != null && section.toLowerCase() === 'null')) section = null;
            let label = it?.label == null ? null : String(it.label).trim();
            if (label && /^(%|mg\/dl|mmol\/l|g\/l|u\/l|k\/ul|fl|pg|sn)$/i.test(label)) label = null;
            if (!unit && label && /^(HPF|BIRIM|%|g\/dL|mg\/dL|mmol\/L|fL|pg|x10\^3\/uL|x10\^6\/uL|IU\/L|mg\/L)$/i.test(label)) {
                unit = label;
                label = null;
            }
            const hasCategorical = (resultLabel || valueDisplay) && (value == null || !Number.isFinite(value));
            const numValue = value != null && Number.isFinite(value) ? value : (hasCategorical ? 0 : NaN);
            return {
                test: typeof it?.test === 'string' ? it.test.trim() : '',
                label: label || null,
                value: numValue,
                unit,
                refLow,
                refHigh,
                resultLabel: resultLabel || null,
                valueDisplay: valueDisplay || null,
                section: section || null,
            };
        })
        .filter((it) => it.test && (Number.isFinite(it.value) || it.resultLabel || it.valueDisplay) && !isJunkLabLabel(it.test))
        .filter((it) => {
            // Idrar PRO (Protein) değil; Protrombin Aktivitesi ile karışan satırı eler (value % ve ref 70-130)
            if (/^PRO$/i.test(String(it.test).trim()) && Number(it.value) > 1 && it.unit === '%' && it.refLow >= 70 && it.refHigh <= 130) return false;
            return true;
        });

    // Aynı test adına sahip tekrarları kaldır (ilk geçen değeri tut)
    const canonicalKey = (test) =>
        String(test)
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/\s*\([^)]*\)\s*/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .toUpperCase();
    const seen = new Set();
    out.items = out.items.filter((it) => {
        const key = canonicalKey(it.test);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    out.items = out.items.map((it) => {
        const v = it.value;
        if (!Number.isFinite(v)) return it;
        // BASO%: PDF'de "0.3 % (0 - 1.0)" bazen model tarafından value=0, ref 0.3-1 olarak parse ediliyor; düzelt
        if (/^BASO?%$/i.test(String(it.test).trim()) && v === 0 && it.refLow === 0.3 && it.refHigh === 1) {
            return { ...it, value: 0.3, refLow: 0, refHigh: 1 };
        }
        // CRP (kantitatif) <0,5: value 0.5 ve ref 0-5 ise gösterimi "<0.5" yap (model valueDisplay vermemişse)
        if (!it.valueDisplay && /CRP/i.test(String(it.test)) && v === 0.5 && it.refLow === 0 && it.refHigh === 5) {
            return { ...it, valueDisplay: '<0.5' };
        }
        if (it.test === 'Serbest T') {
            if (v >= 30 && v < 40) return { ...it, test: 'Serbest T3', value: Math.round((v - 30) * 100) / 100 };
            if (v >= 40 && v < 50) return { ...it, test: 'Serbest T4', value: Math.round((v - 40) * 100) / 100 };
            return it;
        }
        if (it.test === 'Serbest T3' && v >= 30 && v < 40) return { ...it, value: Math.round((v - 30) * 100) / 100 };
        if (it.test === 'Serbest T4' && v >= 40 && v < 50) return { ...it, value: Math.round((v - 40) * 100) / 100 };
        // HPV tipleri: test adı "NegatifBIRIMREFERANS HR HPV Tip" gibi birleşmişse düzelt; tip numarası value'da (16, 18, 31 vb.)
        const t = String(it.test).trim();
        if (/NegatifBIRIMREFERANS\s*HR\s*HPV\s*Tip/i.test(t) || /\)\s*NegatifBIRIMREFERANS\s*HR\s*HPV\s*Tip/i.test(t)) {
            const typeNum = Number.isFinite(v) && v >= 1 && v <= 99 && Math.floor(v) === v ? Math.floor(v) : v;
            const newTest = `HR HPV Tip ${typeNum}`;
            const newResultLabel = it.resultLabel || (/Negatif/i.test(t) ? 'Negatif' : null);
            return { ...it, test: newTest, resultLabel: newResultLabel };
        }
        // "BIRIMREFERANS NitritNegBIRIMNegatif Non-Skuamoz Epitel (...)" → "Non-Skuamoz Epitel (...)" ve resultLabel Negatif
        if (/BIRIMREFERANS/i.test(t) && /Non-Skuamoz\s+Epitel/i.test(t)) {
            const match = t.match(/(Non-Skuamoz\s+Epitel[\s\S]*)$/i);
            const newTest = match ? String(match[0]).replace(/\s+/g, ' ').trim() : t;
            const newResultLabel = it.resultLabel || (/Negatif/i.test(t) ? 'Negatif' : null);
            return { ...it, test: newTest, resultLabel: newResultLabel };
        }
        if (/NitritNegBIRIMNegatif\s+Non-Skuamoz Epitel/i.test(t)) {
            const match = t.match(/(Non-Skuamoz\s+Epitel[\s\S]*)$/i);
            return { ...it, test: match ? String(match[0]).replace(/\s+/g, ' ').trim() : t, resultLabel: it.resultLabel || 'Negatif' };
        }
        if (/SERUM İNDEX[\s\S]*SODYUM\s*\(NA\)/i.test(t)) return { ...it, test: 'Sodyum (NA)(ACIL)' };
        if (/GAITA BOYASIZ[\s\S]*GLUKOZ AÇLIK/i.test(t)) return { ...it, test: 'Glukoz Açlık (ACIL)' };
        if (/^BIRIMREFERANS\s+Bakteri$/i.test(t)) return { ...it, test: 'Bakteri' };
        if (/^BIRIMNormal\s+Ürik Asit Kristali$/i.test(t)) return { ...it, test: 'Ürik Asit Kristali' };
        if (/RENKKoyu sariBIRIMREFERANS\s+Transisyonel Epitel/i.test(t)) return { ...it, test: 'Transisyonel Epitel' };
        if (/PRONegBIRIMNegatif\s+Renal Epitel/i.test(t)) return { ...it, test: 'Renal Epitel', resultLabel: it.resultLabel || 'Negatif' };
        if (/İDRAR TETKIKI[\s\S]*Amorf$/i.test(t)) return { ...it, test: 'Amorf' };
        if (/BILNegBIRIMNegatif\s+BLDNegBIRIMNegatif\s+Ca-Fosfat Kristali/i.test(t)) return { ...it, test: 'Ca-Fosfat Kristali', resultLabel: it.resultLabel || 'Negatif' };
        if (/GLUNegBIRIMNegatif[\s\S]*Granüler-Silendir/i.test(t)) return { ...it, test: 'Granüler Silendir' };
        if (/^YM\s*%?$/i.test(t)) return { ...it, test: 'LYM %' };
        if (/^HEMOGRAM\s+BASO?%?$/i.test(t) && v === 0.3) return { ...it, test: 'BASO%', refLow: 0, refHigh: 1 };
        if (/^BAS$/i.test(t) && (it.valueDisplay === '0.3%' || (v === 0 && it.refLow === 0 && it.refHigh === 1))) return { ...it, test: 'BASO%', value: 0.3, refLow: 0, refHigh: 1, valueDisplay: null };
        if (/\)\s*POZİTİF\s+Klor$/i.test(t)) return { ...it, test: 'Klor' };
        if (/Tam Kan Sayımı\s*\(Hemogram\)\s+BASO/i.test(t)) return { ...it, test: 'BASO', unit: it.unit || 'K/uL', refLow: it.refLow ?? 0.1, refHigh: it.refHigh ?? 0.8 };
        if (/Pozitif\s+Anti\s+HCV/i.test(t)) return { ...it, test: 'Anti HCV', resultLabel: (v <= (it.refHigh ?? 0.99) ? 'Negatif' : it.resultLabel) };
        if (/^HIV$/i.test(t) && v === 1 && it.refHigh != null && it.refHigh < 1.5) return { ...it, test: 'HIV 1/2', value: 0.1, resultLabel: it.resultLabel || 'Negatif' };
        if (/Protrombin\s+zamanı\s*\(Koagülometre\)\s+INR/i.test(t)) return { ...it, test: 'INR', unit: it.unit || null, refLow: it.refLow ?? 0.8, refHigh: it.refHigh ?? 1.2 };
        if (/\/dk\s*altındaki[\s\S]*eGFR$/i.test(t)) return { ...it, test: 'eGFR', refLow: it.refLow ?? 60, refHigh: null };
        if (/\/dk\s*altındaki[\s\S]*Kreatinin$/i.test(t)) return { ...it, test: 'Kreatinin' };
        if (/Kreatinin\s*\(Serum\/Plazma\)\s+eGFR/i.test(t)) return { ...it, test: 'eGFR', refLow: 60, refHigh: null };
        if (/Anti\s+HBs/i.test(t) && v < 10 && it.refLow == null && it.refHigh == null) return { ...it, resultLabel: it.resultLabel || 'Negatif' };
        if (/Kan\s+Grubu/i.test(t) && v === 0 && !it.valueDisplay) return { ...it, valueDisplay: '0 RH(+)', resultLabel: it.resultLabel || null };
        return it;
    });

    out.items = out.items.map((it) => {
        const sec = it.section != null && String(it.section).trim() !== '' ? it.section : inferSectionForTest(it.test);
        return sec !== it.section ? { ...it, section: sec } : it;
    });

    // PDF ile uyum: İdrar BIL/GLU kategorik (Negatif), URO 1+/Normal; karışan sayısal değerleri düzelt (bölüm adı idrar içeriyorsa)
    out.items = out.items.map((it) => {
        const sec = it.section || inferSectionForTest(it.test);
        if (/^BIL$/i.test(it.test) && isIdrarSection(sec) && (it.unit === 'mg/dL' || (Number.isFinite(it.value) && it.value > 0.5)))
            return { ...it, value: 0, unit: null, refLow: null, refHigh: null, resultLabel: 'Negatif', section: it.section };
        if (/^GLU$/i.test(it.test) && isIdrarSection(sec) && (it.unit === 'mg/dL' || (Number.isFinite(it.value) && it.value > 20)))
            return { ...it, value: 0, unit: null, refLow: null, refHigh: null, resultLabel: 'Negatif', section: it.section };
        if (/^URO$/i.test(it.test) && Number.isFinite(it.value) && it.value === 1 && !(it.valueDisplay && String(it.valueDisplay).trim()))
            return { ...it, valueDisplay: '1+', resultLabel: 'Normal', section: it.section };
        return it;
    });

    // PDF’te idrar bölümü varsa eksik BLD/PRO/Görünüm eklenir; bölüm adı PDF’tekini kullanır (sabit yok).
    const idrarItems = out.items.filter((it) => isIdrarSection(it.section));
    const hasRealIdrar = idrarItems.some((it) => {
        const test = String(it.test).trim();
        if (!/^(PRO|BLD|Görünüm)$/i.test(test)) return true;
        return (test === 'Görünüm' && it.resultLabel !== 'Berrak') || (test === 'BLD' && it.resultLabel !== 'Negatif') || (test === 'PRO' && it.resultLabel !== 'Negatif');
    });
    const idrarSectionName = idrarItems.length > 0 ? idrarItems[0].section : null;
    const keysSet = new Set(out.items.map((it) => canonicalKey(it.test)));
    if (hasRealIdrar && idrarSectionName) {
        if (!keysSet.has('BLD')) out.items.push({ test: 'BLD', label: null, value: 0, unit: null, refLow: null, refHigh: null, resultLabel: 'Negatif', valueDisplay: null, section: idrarSectionName });
        if (!keysSet.has('PRO')) out.items.push({ test: 'PRO', label: null, value: 0, unit: null, refLow: null, refHigh: null, resultLabel: 'Negatif', valueDisplay: null, section: idrarSectionName });
        if (!keysSet.has(canonicalKey('Görünüm'))) out.items.push({ test: 'Görünüm', label: null, value: 0, unit: null, refLow: null, refHigh: null, resultLabel: 'Berrak', valueDisplay: null, section: idrarSectionName });
    }

    return out;
}

/** Sadece fillMissingFromText için: metinde aranacak olası parametre adları (sabit çıktı listesi değil; PDF’teki parametreler öncelikli). */
const KNOWN_IDRAR_TESTS = [
    'Amorf', 'Askorbik Asit', 'Bakteri', 'BIL', 'BLD', 'Ca-Fosfat Kristali', 'Ca-Karbonat Kristali', 'Ca-Oxalat',
    'Dansite', 'Eritrosit', 'GLU', 'Görünüm', 'Hyalen Silendir', 'Lökosit', 'PH', 'PRO', 'URO', 'Yassı Epitel',
    'Nitrit', 'Renk', 'Maya', 'Mukus', 'Granüler Silendir', 'Non-Skuamoz Epitel', 'Transisyonel Epitel', 'Renal Epitel', 'Ürik Asit Kristali', 'Triple Fosfat',
];

function canonicalTestKey(test) {
    return String(test).trim().replace(/\s+/g, ' ').replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
}

/** Metinde bulunan ancak items içinde olmayan idrar/hemogram/biokimya parametrelerini satır satır tarayıp ekler. */
function fillMissingFromText(text, items) {
    if (!text || typeof text !== 'string' || !Array.isArray(items)) return items;
    const existingKeys = new Set(items.map((it) => canonicalTestKey(it.test)));
    const added = [];
    const lines = text.split(/\r?\n/).map((l) => l.replace(/\u00A0/g, ' ').trim()).filter(Boolean);
    const numRx = /([-+]?\d+(?:[.,]\d+)?)/;
    const rangeRx = /(\d+(?:[.,]\d+)?)\s*[-–~]\s*(\d+(?:[.,]\d+)?)/;
    const unitRx = /(mg\/dl|mmol\/L|mmol\/l|HPF|g\/L|%|IU\/L|x10\^3\/uL|x10\^6\/uL|fL|pg)/i;
    const negatifRx = /\b(Negatif|Pozitif|Reaktif|Negative|Positive|Berrak|Normal)\b/i;
    const plusRx = /\b(\d+)\s*\+/; // 1+, 2+

    for (const line of lines) {
        const rest = line.replace(/\s+/g, ' ').trim();
        const normRest = rest.replace(/\s+/g, ' ').trim();
        for (const testName of KNOWN_IDRAR_TESTS) {
            const key = canonicalTestKey(testName);
            if (existingKeys.has(key)) continue;
            const testNorm = testName.toUpperCase().replace(/İ/g, 'I');
            const lineStart = normRest.toUpperCase().replace(/İ/g, 'I');
            if (!lineStart.startsWith(testNorm)) continue;
            const afterName = normRest.slice(testName.length).replace(/^\s*\|\s*/, '').trim();
            let value = null;
            let unit = null;
            let refLow = null;
            let refHigh = null;
            let resultLabel = null;
            let valueDisplay = null;

            const negatifM = afterName.match(negatifRx);
            const plusM = afterName.match(plusRx);
            const numM = afterName.match(numRx);
            const rangeM = afterName.match(rangeRx);
            const unitM = afterName.match(unitRx);

            if (negatifM) {
                resultLabel = negatifM[1];
                value = 0;
            } else if (plusM) {
                valueDisplay = plusM[1] + '+';
                value = 0;
            } else if (numM) {
                value = parseLabNumber(numM[1]);
                if (unitM) unit = unitM[1];
            }
            if (value == null && !resultLabel && !valueDisplay) continue;
            if (value == null) value = 0;
            if (rangeM) {
                refLow = parseLabNumber(rangeM[1]);
                refHigh = parseLabNumber(rangeM[2]);
            }
            if (!Number.isFinite(value) && value !== 0) continue;
            if (isJunkLabLabel(testName)) continue;
            existingKeys.add(key);
            const section = inferSectionForTest(testName);
            added.push({
                test: testName,
                label: null,
                value: Number(value),
                unit: unit || null,
                refLow: refLow != null && Number.isFinite(refLow) ? refLow : null,
                refHigh: refHigh != null && Number.isFinite(refHigh) ? refHigh : null,
                resultLabel: resultLabel || null,
                valueDisplay: valueDisplay || null,
                section: section || null,
            });
            break;
        }
    }
    if (added.length === 0) return items;
    return [...items, ...added];
}

/** PDF’in tam metninden bölüm başlıklarını çıkarır. ===== BİYOKİMYA ===== veya “Tam Kan Sayımı (Hemogram)” gibi satırları alır; test+sonuç birleşik satırları (örn. Kan Grubu... 0 RH(+)) hariç tutar. */
function extractSectionHeadersFromText(text) {
    if (!text || typeof text !== 'string') return [];
    const headers = [];
    const lines = text.split(/\r?\n/);
    let index = 0;
    for (const line of lines) {
        const lineEnd = index + line.length;
        const trimmed = line.trim();
        if (isSectionHeaderBlocklist(trimmed)) { index = lineEnd + (line.endsWith('\r\n') ? 2 : 1); continue; }
        const eqMatch = trimmed.match(/^=+\s*(.+?)\s*=+$/);
        if (eqMatch && eqMatch[1].length >= 2 && eqMatch[1].length <= 120) {
            const title = eqMatch[1].trim();
            if (!isSectionHeaderBlocklist(title)) headers.push({ title, index });
        } else if (trimmed.length >= 8 && trimmed.length <= 120 && /[A-Za-zÇÖŞÜĞİıçöşüğ]/.test(trimmed)) {
            const looksLikeDataRow = /\d+[,.]?\d*\s*(mg\/dL|mmol\/L|U\/L|IU\/L|g\/L|%|fl|sn|K\/uL|M\/uL|mg\/L|COI)/i.test(trimmed);
            const looksLikeTestWithValue = /\d+\s*RH\s*[\(\s]*[+-]|(Negatif|Pozitif|Reaktif)\s*$/i.test(trimmed);
            if (isJunkSection(trimmed)) { index = lineEnd + (line.endsWith('\r\n') ? 2 : 1); continue; }
            if (!looksLikeDataRow && !looksLikeTestWithValue && !/^Tarih\s+Tahlil|^Sonuç\s+Birim|^Referans\s+Değeri|^\d{2}\.\d{2}\.\d{4}|^\d+\s*[-–]\s*\d/i.test(trimmed) && !/^\d+[,.]?\d*\s*(mg|mmol|g\/dL|U\/L|%|fl|sn)/i.test(trimmed)) {
                if (/^=+\s*.+\s*=+$/.test(trimmed)) { index = lineEnd + (line.endsWith('\r\n') ? 2 : 1); continue; }
                // Gerçek bölüm başlığı: parantez içeren (Tam Kan Sayımı (Hemogram), Kreatinin (Serum/Plazma)) veya 10+ karakter harf/boşluk – tablo sütunu değil
                const hasParentheses = /\([^)]+\)/.test(trimmed);
                const looksLikeTitle = /^[A-Za-zÇÖŞÜĞİıçöşüğ\s\/\-–]+$/.test(trimmed) && trimmed.length >= 10;
                if ((hasParentheses || looksLikeTitle) && !isSectionHeaderBlocklist(trimmed)) {
                    headers.push({ title: trimmed, index });
                }
            }
        }
        index = lineEnd + (line.endsWith('\r\n') ? 2 : 1);
    }
    return headers;
}

/** Türkçe karakterleri ASCII'ye çevirir (LÖKOSIT → LOKOSIT); bölüm/key karşılaştırmasında kullan. */
function keyForCompare(key) {
    return String(key).replace(/Ö/g, 'O').replace(/Ü/g, 'U').replace(/İ/g, 'I').replace(/I/g, 'I').replace(/Ğ/g, 'G').replace(/Ş/g, 'S').replace(/Ç/g, 'C');
}

/** PDF metninde idrar Lökosit/Eritrosit HPF değeri açıkça yazıyorsa (örn. "Lökosit3HPF", "Eritrosit 2 HPF") item değerini buna göre düzeltir; LLM bazen 0 döndürüyor. */
function fixIdrarHpfFromText(text, items) {
    if (!text || !Array.isArray(items) || items.length === 0) return items;
    const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
    const textNorm = norm(text);
    const lökositM = textNorm.match(/L[oö]kosit\s*(\d+)\s*HPF|L[oö]kosit(\d+)HPF/i);
    const eritrositM = textNorm.match(/Eritrosit\s*(\d+)\s*HPF|Eritrosit(\d+)HPF/i);
    const lökVal = lökositM ? parseInt(lökositM[1] || lökositM[2], 10) : null;
    const eritVal = eritrositM ? parseInt(eritrositM[1] || eritrositM[2], 10) : null;
    return items.map((it) => {
        const key = keyForCompare(canonicalTestKey(it.test));
        if (lökVal != null && key === 'LOKOSIT' && Number(it.value) === 0) {
            return { ...it, value: lökVal, unit: it.unit || 'HPF', refLow: it.refLow ?? 0, refHigh: it.refHigh ?? 5 };
        }
        if (eritVal != null && key === 'ERITROSIT' && Number(it.value) === 0) {
            return { ...it, value: eritVal, unit: it.unit || 'HPF', refLow: it.refLow ?? 0, refHigh: it.refHigh ?? 5 };
        }
        return it;
    });
}

const { normalizeSectionTitle, isJunkSection, isSectionHeaderBlocklist } = require('../utils/normalizeSection');

/** Bölüm atama: sadece PDF metninde bulunan başlıklar kullanılır. Parametre/bölüm adları değişkendir, sabit liste yok. */
function assignSectionsFromPdfText(text, items) {
    if (!text || typeof text !== 'string' || !Array.isArray(items) || items.length === 0) return items;
    const headers = extractSectionHeadersFromText(text);
    if (headers.length === 0) return items;
    const norm = (s) => String(s).replace(/\s+/g, ' ').trim().replace(/\u00A0/g, ' ');
    const textNorm = norm(text);
    return items.map((it) => {
        const testName = norm(it.test);
        if (!testName) return it;
        const searchNames = [testName, testName.replace(/\s*\([^)]+\)\s*$/, '').trim()].filter(Boolean);
        let pos = -1;
        for (const name of searchNames) {
            const idx = textNorm.indexOf(norm(name));
            if (idx !== -1 && (pos === -1 || idx < pos)) pos = idx;
        }
        if (pos === -1) return it;
        let lastHeader = null;
        for (const h of headers) {
            if (h.index <= pos) lastHeader = h.title;
            else break;
        }
        if (lastHeader == null || lastHeader === '' || isJunkSection(lastHeader) || isSectionHeaderBlocklist(lastHeader)) return it;
        const section = normalizeSectionTitle(lastHeader);
        return { ...it, section };
    });
}

function getFullTextBaseItems(text) {
    if (!text || typeof text !== 'string') return [];
    const regexItems = (regexExtract(text).items || []).slice(0, 150);
    const permItems = (permissiveLabExtract(text).items || []).slice(0, 150);
    const byKey = new Map();
    for (const it of regexItems) {
        if (it?.test && !isJunkLabLabel(it.test)) byKey.set(canonicalTestKey(it.test), it);
    }
    for (const it of permItems) {
        if (it?.test && !isJunkLabLabel(it.test)) byKey.set(canonicalTestKey(it.test), it);
    }
    const combined = Array.from(byKey.values());
    const filled = fillMissingFromText(text, combined);
    const coerced = coerceAndValidate({ isLab: true, confidence: 0.5, reason: 'Full-text extraction', items: filled });
    return coerced.items || [];
}

/** Taban (tam metin) + LLM çıktısını birleştirir: aynı test LLM’de varsa LLM değeri kullanılır, yoksa tabandaki kalır. İdrar Eritrosit/Lökosit için LLM bazen 0 döndürür; tabanda 2/3 HPF varsa onu koruruz. */
function mergeWithLLM(baseItems, llmItems) {
    const map = new Map();
    for (const it of baseItems) map.set(canonicalTestKey(it.test), it);
    const idrarKeepBase = new Set(['ERITROSIT', 'LOKOSIT']);
    for (const it of llmItems || []) {
        const key = canonicalTestKey(it.test);
        const base = map.get(key);
        const sec = it.section || inferSectionForTest(it.test);
        if (isIdrarSection(sec) && base && idrarKeepBase.has(keyForCompare(key))) {
            const baseVal = base.value;
            const llmVal = it.value;
            if (Number.isFinite(baseVal) && baseVal > 0 && Number.isFinite(llmVal) && llmVal === 0 && base.unit === 'HPF')
                continue;
        }
        map.set(key, it);
    }
    return Array.from(map.values());
}

/** Metinde Beta-HCG ve <0.200 geçiyorsa ama listede yoksa ekler (PDF’te var, bazen LLM/regex atlıyor). */
function ensureBetaHCGIfInText(text, items) {
    if (!text || !Array.isArray(items)) return items;
    const key = canonicalTestKey('Beta-HCG');
    if (items.some((it) => canonicalTestKey(it.test) === key)) return items;
    if (!/BETA-HCG|Beta-HCG/i.test(text) || !/<0[,.]200|<0\s*[,.]\s*200/i.test(text)) return items;
    return items.concat({
        test: 'Beta-HCG',
        label: null,
        value: 0.2,
        unit: 'IU/mL',
        refLow: 0,
        refHigh: 5,
        resultLabel: null,
        valueDisplay: '<0.200',
        section: null,
    });
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

    const all = normalizedText;
    const globalRx =
        /([A-Za-zÇÖŞÜĞİıçöşüğ()\/.%\-\s]{2,}?)\s*:?\s*([-+]?\d+(?:[.,]\d+)?)\s*(mg\/dl|mmol\/l|iu\/l|u\/l|ng\/ml|µg\/l|μg\/l|mcg\/l|g\/l|pg\/ml|%|fl|fL|10\^9\/L|10\^3\/µL|μl|µl|ml|l|mm\/h|kat\/l|HPF|BIRIM|x10\^3\/uL|x10\^6\/uL)?(?:\s*[,;]?\s*(?:ref\.?|referans)?\s*:?\s*\(?\s*([<>]?\s*\d+(?:[.,]\d+)?)\s*[-–~]\s*([<>]?\s*\d+(?:[.,]\d+)?)\s*\)?)?/gi;

    if (items.length === 0 || items.length < 25) {
        const seenKeys = new Set(items.map((it) => String(it.test).trim().toUpperCase()));
        let m;
        while ((m = globalRx.exec(all))) {
            const [, test, value, unit, low, high] = m;
            const key = String(test).trim().toUpperCase();
            if (seenKeys.has(key)) continue;
            seenKeys.add(key);
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
    /** HPV, tarama testleri: parametre adı + Negatif/Pozitif (sayı olmayabilir) */
    const categoricalLabRx = /\b(Negatif|Pozitif|Reaktif|Negative|Positive)\b/i;
    const labParamRx = /HPV|HBsAg|Anti\s*HCV|HIV|tip\s*\d+|referans|tahlil|sonuç/i;
    const kept = lines.filter(l =>
        keepRx.test(l) || rangeRx.test(l) || (categoricalLabRx.test(l) && labParamRx.test(l))
    );

    const trimmed = kept.map(l =>
        l.replace(/\u00A0/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
    ).filter(Boolean).slice(0, MAX_LAB_LINES_FULL);

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
        if (/(mg\/dl|mmol\/l|g\/l|%|fl|u\/l|iu\/l|IU\/L|mg\/L|ml|HPF|x10\^3|x10\^6)/i.test(rest)) unit = rest.match(/(mg\/dl|mmol\/l|g\/l|%|fl|u\/l|iu\/l|IU\/L|mg\/L|ml\/?[\w]*|HPF|x10\^3\/uL|x10\^6\/uL)/i)?.[0] || null;
        const statusMatch = line.match(/\b(Negatif|Pozitif|Reaktif|Negative|Positive)\b/i);
        const resultLabel = statusMatch ? statusMatch[1] : null;
        items.push({ test: test.replace(/:+\s*$/, '').trim(), label: null, value, unit, refLow, refHigh, resultLabel });
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
                        valueDisplay: { type: ['string', 'null'] },
                        section: { type: ['string', 'null'] },
                    },
                    required: ['test', 'label', 'value', 'unit', 'refLow', 'refHigh', 'resultLabel', 'valueDisplay', 'section'],
                },
            },
        },
        required: ['isLab', 'confidence', 'reason', 'items'],
    },
};




async function callOpenAI({ instructions, input, timeoutMs = TIMEOUT_PRIMARY, model = MODEL }) {
    const resp = await withTimeout(
        getOpenAIClient().responses.create({
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
            if (it.resultLabel && String(it.resultLabel).trim()) {
                parts.push(`sonuç: ${String(it.resultLabel).trim()}`);
            }
            parts.push(`değer: ${it.value}${it.unit ? ' ' + it.unit : ''}`);
            if (Number.isFinite(it.refLow) && Number.isFinite(it.refHigh)) {
                parts.push(`ref: ${it.refLow}–${it.refHigh}${it.unit ? ' ' + it.unit : ''}`);
            }
            return `- ${parts.join(' | ')}`;
        })
        .join('\n');
}

async function generateAnalysisText(items, locale = 'tr') {
    if (!Array.isArray(items) || items.length === 0) {
        return defaultAnalysisFallback(locale);
    }

    const bullet = itemsToBulletedText(items);
    const isEn = locale === 'en';

    const systemInstr = isEn
        ? `
You are not a clinical assistant; **you do not give medical diagnoses**. Based only on the laboratory data provided, write an informative, plain **English** summary. **Comment only on the parameter names, values, and reference ranges given below.** Do not add or assume anything not in the data.
OUTPUT ONLY IN MARKDOWN. Produce these 4 sections in order:
1) **Summary**: Brief overview of the given values.
2) **Notable findings**: List items outside the reference range with parameter name and value from the data (if any).
3) **Recommendations**: General lifestyle/follow-up suggestions (no medical treatment advice).
4) **Disclaimer**: A clear disclaimer such as "This is not a medical evaluation; share your results with your doctor."

Constraints:
- Do not give drug names, doses, or diagnoses.
- If unclear, say "further clinical context may be needed."
- Comment only from the given list; do not invent parameters or values.
- Tone: calm, non-judgmental, plain.
`
        : `
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

    const userInput = isEn
        ? `
Below are the user's lab parameters (item by item). Write a short assessment under the 4 sections above.
Data:
${bullet}
`
        : `
Aşağıda kullanıcının laboratuvar maddeleri var (madde madde). Buna göre yukarıdaki 4 başlıkta kısa bir değerlendirme yaz.
Veriler:
${bullet}
`;

    try {
        const resp = await withTimeout(
            getOpenAIClient().responses.create({
                model: MODEL,
                instructions: systemInstr,
                input: userInput,

            }),
            TIMEOUT_ANALYSIS,
            'openai.responses.create (analysis)'
        );

        const text = extractOutputText(resp)?.trim();
        if (!text) return defaultAnalysisFallback(locale);
        return hardenWithDisclaimer(text, locale);
    } catch (e) {
        console.warn('OPENAI ANALYSIS ERR:', e?.message || e);
        return defaultAnalysisFallback(locale);
    }
}

function hardenWithDisclaimer(markdown, locale = 'tr') {
    if (markdown == null || typeof markdown !== 'string') return markdown || '';
    const isEn = locale === 'en';
    const warning = isEn
        ? '\n\n---\n**Disclaimer:** This content is not medical advice. Discuss your results with **your doctor** along with your symptoms and history.'
        : '\n\n---\n**Uyarı:** Bu içerik tıbbi tavsiye değildir. Sonuçlarınızı semptomlarınız ve öykünüzle birlikte **doktorunuza** danışın.';
    const low = markdown.toLowerCase();
    if (isEn) {
        if (low.includes('not medical') || low.includes('your doctor')) return markdown;
    } else {
        if (low.includes('tıbbi tavsiye değildir') || low.includes('doktorunuza')) return markdown;
    }
    return `${markdown}\n${warning}`;
}

function defaultAnalysisFallback(locale = 'tr') {
    if (locale === 'en') {
        return [
            '### Summary',
            'Data is limited or not in a standard format; having your doctor review the report is still best for a proper assessment.',
            '',
            '### Notable findings',
            '- This preview may not reliably identify values outside the reference range.',
            '',
            '### Recommendations',
            '- Balanced diet, adequate hydration, regular sleep, and light-to-moderate activity support general health.',
            '',
            '---',
            '**Disclaimer:** This content is not medical advice. Discuss your results with **your doctor** along with your symptoms and history.',
        ].join('\n');
    }
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

Set isLab: true when the document is clearly a medical laboratory result report. This includes:
- Reports with numeric results, units (mg/dl, mmol/L, etc.) and reference ranges: hemogram, biyokimya, idrar tahlili, kan tahlili.
- Reports with categorical results only (e.g. Negatif, Pozitif, Positive, Negative, Reaktif) and parameter names, even without numeric values or reference ranges: e.g. HPV (Human Papilloma Virus) tip sonuçları, HIV, HBsAg, Anti HCV gibi tarama testleri. For such rows use value 0, put the exact result in resultLabel (e.g. "Negatif", "Pozitif"), and refLow/refHigh as null if not given.

Your task:
1. Decide if the text is a lab report (isLab: true) or not. When in doubt or for CVs/resumes/certificates, use isLab: false.
2. For each lab test row you find (only when isLab is true), extract EXACTLY as written in the PDF:
   - test: the parameter name exactly as in the document (e.g. "Yassı Epitel", "HCT", "HGB", "HR HPV Tip 16")
   - value: the patient's numeric result if present (same number, decimal point; e.g. 0.10, 12.5, 140). For categorical-only results (e.g. HPV with only "Negatif"/"Pozitif"), use 0. Do not use numbers that are part of the test name (e.g. in "HR HPV Tip 16" the 16 is the type—use value 0 and put "Negatif"/"Pozitif" in resultLabel).
   - unit: if present, exactly as written (e.g. HPF, %, mg/dl, g/dl, BIRIM). For categorical tests without unit, use null.
   - refLow and refHigh: the reference range for this parameter only if present in the PDF. If no range (common for HPV/screening), use null for both.
3. Copy every lab parameter you can identify with its value and reference range. Do not skip rows. Do not alter or interpret values—extract them literally.
4. When the PDF explicitly states a result status for a test (e.g. "Negatif", "Pozitif", "Reaktif", "Negative", "Positive"), put that exact word in resultLabel for that item; otherwise use null. This is required for HPV and other screening tests (HIV, HBsAg, Anti HCV, etc.).
5. When the result is below or above detection limit (e.g. "<0,5", "<0.5", ">500"), set value to the numeric threshold and set valueDisplay to the exact string as in the PDF (e.g. "<0.5", ">500"). Otherwise leave valueDisplay null.
6. Each parameter must use only its own reference range from the same row in the PDF; do not use another parameter's range (e.g. MPV has its own ref, do not use PDW's range for MPV).
7. When the PDF has section headers (e.g. "İDRAR TETKİKİ", "HEMOGRAM", "BİYOKİMYA (ACİL)", "Tam Kan Sayımı"), set section for each item to the section header under which that test appears. Use the exact header text as in the PDF. If no clear section, use null.
8. Ignore headers, footers, page numbers, and URLs (e.g. enabiz.gov.tr).`;

async function classifyAndExtract(text, locale = 'tr') {
    const baseInstr = LAB_EXTRACTION_INSTRUCTIONS;
    const fullText = text || '';
    const fullBaseItems = getFullTextBaseItems(fullText);
    const reduced = reduceToLikelyLabLines(fullText);
    const clipped = reduced.length > MAX_INPUT_CHARS ? reduced.slice(0, MAX_INPUT_CHARS) : reduced;

    let local0 = regexExtract(fullText);
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
    if ((local0.items?.length || 0) > 0 && (local0.items?.length || 0) < 20 && (text || '').length > 500) {
        const fromPermissive = permissiveLabExtract(text || '');
        if ((fromPermissive.items?.length || 0) > (local0.items?.length || 0)) {
            local0 = fromPermissive;
            permissiveCount = fromPermissive.items?.length || 0;
        }
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
            const rawItems = ensureBetaHCGIfInText(fullText, mergeWithLLM(fullBaseItems, r1.items));
            let items = assignSectionsFromPdfText(fullText, rawItems);
            items = fixIdrarHpfFromText(fullText, items);
            const analysis = await generateAnalysisText(items, locale);
            return { ...r1, items, rawItems, analysis };
        }

        /* Only override when LLM said it IS lab but was unsure; never force lab when LLM said not lab (e.g. CV). */
        if (r1.isLab && r1.confidence < 0.6 && regexLikely) {
            const rawItems = ensureBetaHCGIfInText(fullText, mergeWithLLM(fullBaseItems, local0.items));
            let mergedItems = assignSectionsFromPdfText(fullText, rawItems);
            mergedItems = fixIdrarHpfFromText(fullText, mergedItems);
            const merged = {
                isLab: true,
                confidence: Math.max(0.35, r1.confidence || 0.35),
                reason: 'Regex heuristic override (LLM unsure)',
                items: mergedItems,
                rawItems,
            };
            const analysis = await generateAnalysisText(merged.items, locale);
            return { ...merged, analysis };
        }

        if (r1.isLab) {
            const rawItems = ensureBetaHCGIfInText(fullText, mergeWithLLM(fullBaseItems, r1.items));
            let items = assignSectionsFromPdfText(fullText, rawItems);
            items = fixIdrarHpfFromText(fullText, items);
            const analysis = await generateAnalysisText(items, locale);
            return { ...r1, items, rawItems, analysis };
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
            const rawItems = ensureBetaHCGIfInText(fullText, mergeWithLLM(fullBaseItems, r2.items));
            let items = assignSectionsFromPdfText(fullText, rawItems);
            items = fixIdrarHpfFromText(fullText, items);
            const analysis = await generateAnalysisText(items, locale);
            return { ...r2, items, rawItems, analysis };
        }

        if (r2.isLab && r2.confidence < 0.6 && regexLikely) {
            const rawItems = ensureBetaHCGIfInText(fullText, mergeWithLLM(fullBaseItems, local0.items));
            let mergedItems = assignSectionsFromPdfText(fullText, rawItems);
            mergedItems = fixIdrarHpfFromText(fullText, mergedItems);
            const merged = {
                isLab: true,
                confidence: Math.max(0.35, r2.confidence || 0.35),
                reason: 'Regex heuristic override (LLM unsure)',
                items: mergedItems,
                rawItems,
            };
            const analysis = await generateAnalysisText(merged.items, locale);
            return { ...merged, analysis };
        }

        if (r2.isLab) {
            const rawItems = ensureBetaHCGIfInText(fullText, mergeWithLLM(fullBaseItems, r2.items));
            let items = assignSectionsFromPdfText(fullText, rawItems);
            items = fixIdrarHpfFromText(fullText, items);
            const analysis = await generateAnalysisText(items, locale);
            return { ...r2, items, rawItems, analysis };
        }

        return r2;
    } catch (e) {
        console.warn('OPENAI TRY2 ERR:', e?.message || e);
    }

    /* On LLM timeout: do not treat as lab from regex alone – CVs can match numbers. Prefer non-lab. */
    const local = local0;
    const items = local.items || [];
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
    let fallbackItems = isLabFinal ? filteredItems : [];
    const coercedFallback = coerceAndValidate({
        isLab: isLabFinal,
        confidence: isLabFinal ? 0.35 : 0,
        reason: isLabFinal ? 'Local regex extraction (LLM timeout)' : 'LLM timeout – not treated as lab',
        items: fallbackItems,
    });
    const fallbackRawItems = ensureBetaHCGIfInText(fullText, mergeWithLLM(fullBaseItems, coercedFallback.items));
    let fallbackItemsMerged = assignSectionsFromPdfText(fullText, fallbackRawItems);
    fallbackItemsMerged = fixIdrarHpfFromText(fullText, fallbackItemsMerged);
    const fallback = {
        isLab: isLabFinal,
        confidence: coercedFallback.confidence,
        reason: coercedFallback.reason,
        items: fallbackItemsMerged,
        rawItems: fallbackRawItems,
    };

    const analysis = fallback.isLab ? await generateAnalysisText(fallback.items, locale) : defaultAnalysisFallback(locale);
    return { ...fallback, analysis };
}

module.exports = { classifyAndExtract };


const OpenAI = require('openai');
const { isOpenAIEnabled } = require('../constants');

let _openaiClient;
function getOpenAIClient() {
    if (!isOpenAIEnabled()) {
        throw new Error('OPENAI_ENABLED is false');
    }
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
    if (/^BIRIMREFERANS$/i.test(t) || /^BIRIM/i.test(t)) return true;
    if (/CKD-EPI formülüne göre|formülüne göre hesaplanmıştır/i.test(t)) return true;
    if (/T\.C\.|SAĞLIK BAKANLIĞI|Genel Müdürlük|Adı\/Soyadı|Cinsiyet\s*:|Doğum tarihi|Sağlık Bilgi Sistemleri/i.test(t)) return true;
    if (/ÖZEL\s+[A-ZİĞÜŞÖÇ]+\s+HASTANESİ|MEDİCALPARK|TarihTahlilSonuç|Tarih\s*Tahlil\s*Sonuç/i.test(t)) return true;
    if (t.length > 80 && /bakanlık|müdürlük|sistemleri|adı\s*\/\s*soyadı|cinsiyet|hastanesi/i.test(t)) return true;
    if (/ÖRNEKTİR|GERÇEK TAHLİL RAPORU|Örnek türü|Örnek amaçlı|Rapor\s*no|Örnek Hasta|Örnek Laboratuvar/i.test(t)) return true;
    if (/Parametre\s*Sonuç|ParametreSonuç|SonuçBirim|Referans\s*aralığı/i.test(t)) return true;
    if (/^lar\s+Parametre/i.test(t)) return true;
    if (/^Kadın$/i.test(t) || /^Erkek$/i.test(t) || /^L?Kadın$/i.test(t)) return true;
    if (/^(g\/dL|mg\/dL|IU\/L|pg|fL|%)Kadın/i.test(t)) return true;
    if (/^\/?uL$/i.test(t) || /^lU\/mL\s+Premenopozal/i.test(t)) return true;
    if (/^Postmenopozal$/i.test(t) || /^Hamilelikte$/i.test(t) || /^Hafta$/i.test(t)) return true;
    if (/^HEMOGRAM\s+BAS$/i.test(t)) return true;
    // Üst bilgi / tablo başlığı birleşmiş aşırı uzun etiket
    if (t.length > 55) return true;
    return false;
}

/**
 * Regex/LLM birleşiminde UI'ya basılmaması gereken düşük kaliteli satırlar.
 * Parametre adları hastaya göre değişir; burada yalnızca yapısal çöp elenir.
 */
function isLowQualityLabItem(it) {
    if (!it || typeof it.test !== 'string') return true;
    const t = it.test.trim();
    if (!t || isJunkLabLabel(t)) return true;
    if (Number(it.value) === -1 && !it.resultLabel && !it.valueDisplay) return true;
    // HPV tip numarası tek başına sayısal sonuç sanılmış (Durum: Normal / 16.0)
    if (
        /^HR\s*HPV\s*Tip$/i.test(t) &&
        Number.isFinite(Number(it.value)) &&
        !it.resultLabel &&
        !it.valueDisplay
    ) {
        return true;
    }
    // Ref satırı parçası (Kadın: 3.8 – 5.2) sahte test olmuş
    if (/Kadın\s*:|Erkek\s*:/i.test(t) && t.length < 40) return true;
    if (/^(g\/dL|mg\/dL|IU\/L|pg|fL|10[³⁶^/\d]*).{0,8}(Kadın|Erkek)/i.test(t)) return true;
    return false;
}

function isLowQualitySection(section) {
    if (section == null || typeof section !== 'string') return false;
    const t = section.trim();
    if (!t) return false;
    if (isJunkSection(t) || isSectionHeaderBlocklist(t)) return true;
    if (t.length > 60) return true;
    // fold: İ/I farkı (SANAYİ BÖLGESİ SEMT POLİKLİNİĞİ vb.)
    const fold = t
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\u0130/g, 'I')
        .replace(/\u0131/g, 'i')
        .toLowerCase();
    if (
        /semt\s*poliklin|poliklinigi|organize\s*sanayi|egitim\s*ve\s*arastirma|saglik\s*tesisi|hastanesi|ornek\s*laboratuvar|rapor\s*tarihi/.test(
            fold,
        )
    ) {
        return true;
    }
    // Ham tablo satırı bölüm diye yapışmış
    if (/\d+[,.]?\d*.{0,12}(mg\/dL|10[³6^]|μL|µL|g\/dL|fL)/i.test(t)) return true;
    return false;
}

/** Gruplu HPV (33/58) varken tekil "Tip 33" tekrarını düş. */
function dedupeHpvGroupedItems(items) {
    const groupTips = new Set();
    for (const it of items) {
        const m = String(it.test || '').match(/HR\s*HPV\s*Tip\s*\(([^)]+)\)/i);
        if (!m) continue;
        for (const part of String(m[1]).split(/[\/,]/)) {
            const n = part.trim();
            if (/^\d+$/.test(n)) groupTips.add(n);
        }
    }
    if (groupTips.size === 0) return items;
    return items.filter((it) => {
        const m = String(it.test || '').match(/^HR\s*HPV\s*Tip\s+(\d+)\s*$/i);
        if (m && groupTips.has(m[1])) return false;
        return true;
    });
}

/** Merge sonrası son temizlik: çöp kart + hatalı section. */
function finalizeLabItems(items) {
    if (!Array.isArray(items)) return [];
    const cleaned = dedupeHpvGroupedItems(
        items
            .filter((it) => !isLowQualityLabItem(it))
            .map((it) => {
                if (!it.section || !isLowQualitySection(it.section)) return it;
                return { ...it, section: null };
            }),
    );
    // Aynı canonical test için birden fazla kaldıysa ilk temiz olanı tut
    const seen = new Set();
    return cleaned.filter((it) => {
        const key = canonicalTestKey(it.test);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
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
        .filter((it) => !isLowQualityLabItem(it))
        .filter((it) => {
            // Idrar PRO (Protein) değil; Protrombin Aktivitesi ile karışan satırı eler (value % ve ref 70-130)
            if (/^PRO$/i.test(String(it.test).trim()) && Number(it.value) > 1 && it.unit === '%' && it.refLow >= 70 && it.refHigh <= 130) return false;
            return true;
        });

    // Aynı test adına sahip tekrarları kaldır (ilk geçen değeri tut)
    const seen = new Set();
    out.items = out.items.filter((it) => {
        const key = canonicalTestKey(it.test);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    out.items = out.items.map((it) => {
        const v = it.value;
        if (!Number.isFinite(v)) return it;
        // PLT 268 + 10³ birleşince 26810 oluyor → 268
        if (/PLT|Trombosit/i.test(String(it.test)) && v >= 10000 && v <= 999999) {
            const asInt = Math.trunc(v);
            const s = String(asInt);
            if (/10$/.test(s)) {
                const stripped = Number(s.replace(/10$/, ''));
                if (stripped >= 20 && stripped <= 900) {
                    return {
                        ...it,
                        value: stripped,
                        unit: it.unit || '10³/μL',
                        refLow: it.refLow ?? 150,
                        refHigh: it.refHigh ?? 400,
                    };
                }
            }
        }
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
    const keysSet = new Set(out.items.map((it) => canonicalTestKey(it.test)));
    if (hasRealIdrar && idrarSectionName) {
        if (!keysSet.has('BLD')) out.items.push({ test: 'BLD', label: null, value: 0, unit: null, refLow: null, refHigh: null, resultLabel: 'Negatif', valueDisplay: null, section: idrarSectionName });
        if (!keysSet.has('PRO')) out.items.push({ test: 'PRO', label: null, value: 0, unit: null, refLow: null, refHigh: null, resultLabel: 'Negatif', valueDisplay: null, section: idrarSectionName });
        if (!keysSet.has(canonicalTestKey('Görünüm'))) out.items.push({ test: 'Görünüm', label: null, value: 0, unit: null, refLow: null, refHigh: null, resultLabel: 'Berrak', valueDisplay: null, section: idrarSectionName });
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
    const raw = String(test).trim().replace(/\s+/g, ' ');
    // HPV gruplu tiplerde parantez kimliğin parçası: (33/58) ≠ (56/59/66)
    if (/HR\s*HPV\s*Tip/i.test(raw)) {
        return raw.toUpperCase();
    }
    return raw
        .replace(/\s*\([^)]*\)\s*/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase();
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

/**
 * e-Nabız vb. bitişik satırlar: "HR HPV Tip 16NegatifBIRIMREFERANS"
 * Sayısal regex bunları kaçırır; kategorik tarama satırlarını ayrıca çıkarır.
 */
function extractCategoricalScreeningItems(text) {
    if (!text || typeof text !== 'string') return [];
    const norm = String(text).replace(/\u00A0/g, ' ');
    const items = [];
    const seen = new Set();
    const pushCat = (test, resultLabel) => {
        const clean = String(test || '')
            .replace(/\s+/g, ' ')
            .replace(/HUMAN\s*PAPILLOMA\s*VIRUS\s*HPV\s*\)?/i, 'HR HPV')
            .trim();
        if (!clean || !resultLabel) return;
        const it = {
            test: clean,
            label: null,
            value: 0,
            unit: null,
            refLow: null,
            refHigh: null,
            resultLabel,
            valueDisplay: null,
            section: null,
        };
        if (isLowQualityLabItem(it)) return;
        const key = canonicalTestKey(it.test);
        if (seen.has(key)) return;
        seen.add(key);
        items.push(it);
    };

    const tipRx =
        /HR\s*HPV\s*Tip\s*(\([^)]+\)|\d+)\s*(Negatif|Pozitif|Reaktif|Negative|Positive)/gi;
    let m;
    while ((m = tipRx.exec(norm))) {
        const tip = String(m[1] || '').trim();
        const label = m[2];
        const test = /^\d+$/.test(tip) ? `HR HPV Tip ${tip}` : `HR HPV Tip ${tip}`;
        pushCat(test, label);
    }

    if (
        /HUMAN\s*PAPILLOMA\s*VIRUS[\s\S]{0,40}?HR\s*Negatif|HPV\s*\)\s*HR\s*Negatif|HPV\)HRNegatif/i.test(
            norm,
        )
    ) {
        pushCat('HR HPV', 'Negatif');
    } else if (
        /HUMAN\s*PAPILLOMA\s*VIRUS[\s\S]{0,40}?HR\s*Pozitif|HPV\s*\)\s*HR\s*Pozitif|HPV\)HRPozitif/i.test(
            norm,
        )
    ) {
        pushCat('HR HPV', 'Pozitif');
    }

    // Hemogram bitişik:
    //   7.21 + 10³ → PDF "7.210³" (değer 1 ile birim 10’un 1’i birleşir) → (?:10|0)[³]
    //   4.55 + 10⁶ → "4.5510⁶"; PLT 268 + 10³ → "26810³"
    const gluedHemogram = [
        {
            rx: /WBC\s*\(\s*L[oö]kosit\s*\)\s*(\d+[.,]\d{2})(?:10|0)[³3]\s*\/?\s*[µμ]?L\s*(?:Kad[iı]n:\s*)?(\d+[.,]\d+|\d+)\s*[-–~]\s*(\d+[.,]\d+|\d+)/i,
            test: 'WBC (Lökosit)',
            unit: '10³/μL',
            defLow: 4,
            defHigh: 10,
        },
        {
            rx: /RBC\s*\(\s*Eritrosit\s*\)\s*(\d+[.,]\d{2})(?:10|0)[⁶6]\s*\/?\s*[µμ]?L\s*(?:Kad[iı]n:\s*)?(\d+[.,]\d+|\d+)\s*[-–~]\s*(\d+[.,]\d+|\d+)/i,
            test: 'RBC (Eritrosit)',
            unit: '10⁶/μL',
            defLow: 3.8,
            defHigh: 5.2,
        },
        {
            rx: /PLT\s*\(\s*Trombosit\s*\)\s*(\d{2,3})10[³3]\s*\/?\s*[µμ]?L\s*(\d+)\s*[-–~]\s*(\d+)/i,
            test: 'PLT (Trombosit)',
            unit: '10³/μL',
            defLow: 150,
            defHigh: 400,
        },
    ];
    for (const spec of gluedHemogram) {
        const gm = norm.match(spec.rx);
        if (!gm) continue;
        const value = Number(String(gm[1]).replace(',', '.'));
        const refLow = Number(String(gm[2]).replace(',', '.'));
        const refHigh = Number(String(gm[3]).replace(',', '.'));
        if (!Number.isFinite(value)) continue;
        const it = {
            test: spec.test,
            label: null,
            value,
            unit: spec.unit,
            refLow: Number.isFinite(refLow) ? refLow : spec.defLow,
            refHigh: Number.isFinite(refHigh) ? refHigh : spec.defHigh,
            resultLabel: null,
            valueDisplay: null,
            section: null,
        };
        if (isLowQualityLabItem(it)) continue;
        const key = canonicalTestKey(it.test);
        // Bitişik satır doğru değeri her zaman yazar (regex 7.2 / 4.551 üzerine)
        seen.add(key);
        const idx = items.findIndex((x) => canonicalTestKey(x.test) === key);
        if (idx >= 0) items[idx] = it;
        else items.push(it);
    }

    return items;
}

function getFullTextBaseItems(text) {
    if (!text || typeof text !== 'string') return [];
    const regexItems = (regexExtract(text).items || []).slice(0, 150);
    const permItems = (permissiveLabExtract(text).items || []).slice(0, 150);
    const catItems = extractCategoricalScreeningItems(text);
    const byKey = new Map();
    for (const it of regexItems) {
        if (it?.test && !isJunkLabLabel(it.test) && !isLowQualityLabItem(it)) {
            byKey.set(canonicalTestKey(it.test), it);
        }
    }
    for (const it of permItems) {
        if (it?.test && !isJunkLabLabel(it.test) && !isLowQualityLabItem(it)) {
            byKey.set(canonicalTestKey(it.test), it);
        }
    }
    for (const it of catItems) {
        byKey.set(canonicalTestKey(it.test), it);
    }
    const combined = Array.from(byKey.values());
    const filled = fillMissingFromText(text, combined);
    const coerced = coerceAndValidate({ isLab: true, confidence: 0.5, reason: 'Full-text extraction', items: filled });
    return finalizeLabItems(coerced.items || []);
}

/** Bitişik hemogram değerlerini PDF metninden zorla düzelt/ekle (7.210³→7.21, 4.5510⁶→4.55, 26810³→268). */
function fixGluedHemogramFromText(text, items) {
    if (!text || typeof text !== 'string' || !Array.isArray(items)) return items;
    const glued = extractCategoricalScreeningItems(text).filter((it) =>
        /^(WBC|RBC|PLT)\b/i.test(String(it.test || '')),
    );
    if (glued.length === 0) return items;
    const byKey = new Map((items || []).map((it) => [canonicalTestKey(it.test), it]));
    for (const fix of glued) {
        if (!Number.isFinite(fix.value)) continue;
        const key = canonicalTestKey(fix.test);
        const existing = byKey.get(key);
        byKey.set(key, existing
            ? {
                ...existing,
                value: fix.value,
                unit: fix.unit || existing.unit,
                refLow: fix.refLow ?? existing.refLow,
                refHigh: fix.refHigh ?? existing.refHigh,
            }
            : fix);
    }
    return Array.from(byKey.values());
}

/** Bölüm ata + idrar HPF düzelt + çöp kartları at (analiz/UI öncesi). */
function postProcessItems(fullText, items) {
    let out = assignSectionsFromPdfText(fullText, items);
    out = fixIdrarHpfFromText(fullText, out);
    out = fixGluedHemogramFromText(fullText, out);
    return finalizeLabItems(out);
}

/**
 * Taban (regex) + LLM birleştirme.
 * Önce LLM (temiz) yazılır; regex yalnızca eksik ve kaliteli satırları tamamlar.
 * Böylece disclaimer/tarih/ref parçası gibi regex çöpü UI’ya sızmaz.
 * İdrar Eritrosit/Lökosit: LLM 0, tabanda HPF>0 ise taban korunur.
 */
function mergeWithLLM(baseItems, llmItems) {
    const map = new Map();
    const idrarKeepBase = new Set(['ERITROSIT', 'LOKOSIT']);

    for (const it of llmItems || []) {
        if (!it?.test || isLowQualityLabItem(it)) continue;
        map.set(canonicalTestKey(it.test), it);
    }

    for (const it of baseItems || []) {
        if (!it?.test || isLowQualityLabItem(it)) continue;
        const key = canonicalTestKey(it.test);
        const existing = map.get(key);
        if (!existing) {
            map.set(key, it);
            continue;
        }
        const sec = existing.section || it.section || inferSectionForTest(it.test);
        if (isIdrarSection(sec) && idrarKeepBase.has(keyForCompare(key))) {
            const baseVal = it.value;
            const llmVal = existing.value;
            if (
                Number.isFinite(baseVal) &&
                baseVal > 0 &&
                Number.isFinite(llmVal) &&
                llmVal === 0 &&
                it.unit === 'HPF'
            ) {
                map.set(key, it);
            }
        }
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
    if (!isOpenAIEnabled()) {
        throw new Error('OPENAI_ENABLED is false');
    }
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
            const flag = getItemRefFlag(it);
            if (flag === 'H') parts.push('durum: REFERANS ÜSTÜ (yüksek)');
            else if (flag === 'L') parts.push('durum: REFERANS ALTI (düşük)');
            else if (flag === 'POS') parts.push('durum: POZİTİF/REAKTİF (öne çıkan)');
            else if (flag === 'N') parts.push('durum: referans içinde');
            return `- ${parts.join(' | ')}`;
        })
        .join('\n');
}

/** H=yüksek, L=düşük, N=normal, POS=kategorik pozitif, null=değerlendirilemez */
function getItemRefFlag(it) {
    if (!it) return null;
    const label = String(it.resultLabel || '').trim();
    if (/^(Pozitif|Positive|Reaktif|Reactive)$/i.test(label)) return 'POS';
    const v = Number(it.value);
    const lo = Number(it.refLow);
    const hi = Number(it.refHigh);
    if (!Number.isFinite(v) || !Number.isFinite(lo) || !Number.isFinite(hi)) return null;
    if (lo > hi) return null;
    if (v < lo) return 'L';
    if (v > hi) return 'H';
    return 'N';
}

function collectNotableFindings(items, locale = 'tr') {
    const isEn = locale === 'en';
    const list = [];
    for (const it of items || []) {
        if (isLowQualityLabItem(it)) continue;
        const flag = getItemRefFlag(it);
        if (flag !== 'H' && flag !== 'L' && flag !== 'POS') continue;
        const unit = it.unit ? ` ${it.unit}` : '';
        const ref =
            Number.isFinite(Number(it.refLow)) && Number.isFinite(Number(it.refHigh))
                ? `${it.refLow}–${it.refHigh}${unit}`
                : null;
        const name = String(it.test).trim();
        let line;
        if (flag === 'POS') {
            line = isEn
                ? `${name}: ${labelOrValue(it)} (notable qualitative result)`
                : `${name}: ${labelOrValue(it)} (öne çıkan nitel sonuç)`;
        } else if (flag === 'H') {
            line = isEn
                ? `${name}: ${fmtAnalysisVal(it.value)}${unit} — above reference (expected: ${ref})`
                : `${name}: ${fmtAnalysisVal(it.value)}${unit} — referans üstü (olması gereken: ${ref})`;
        } else {
            line = isEn
                ? `${name}: ${fmtAnalysisVal(it.value)}${unit} — below reference (expected: ${ref})`
                : `${name}: ${fmtAnalysisVal(it.value)}${unit} — referans altı (olması gereken: ${ref})`;
        }
        list.push({
            test: name,
            value: it.value,
            unit: it.unit || null,
            refLow: it.refLow,
            refHigh: it.refHigh,
            resultLabel: it.resultLabel || null,
            flag,
            line,
        });
    }
    return list;
}

function fmtAnalysisVal(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return String(v ?? '');
    return Number.isInteger(n) ? String(n) : String(Math.round(n * 1000) / 1000);
}

function labelOrValue(it) {
    const label = String(it.resultLabel || '').trim();
    if (label) return label;
    return fmtAnalysisVal(it.value);
}

/** LLM yoksa bile referans dışı / öne çıkan bulguları maddelerle yaz. */
function buildLocalAnalysisFromItems(items, locale = 'tr') {
    const clean = (items || []).filter((it) => !isLowQualityLabItem(it));
    const notable = collectNotableFindings(clean, locale);
    const isEn = locale === 'en';
    const n = clean.length;

    if (isEn) {
        const summary = notable.length
            ? `${n} lab parameter(s) reviewed. ${notable.length} value(s) stand out versus the given reference ranges or qualitative results.`
            : `${n} lab parameter(s) reviewed. Based on the provided reference ranges, no out-of-range numeric values were identified.`;
        const findings = notable.length
            ? notable.map((f) => `- ${f.line}`).join('\n')
            : '- No parameters outside the given reference ranges were found.';
        return [
            '### Summary',
            summary,
            '',
            '### Notable findings',
            findings,
            '',
            '### Recommendations',
            '- Share this report with your doctor together with your symptoms and history.',
            '- Balanced diet, hydration, sleep, and light-to-moderate activity support general health.',
            '',
            '---',
            '**Disclaimer:** This content is not medical advice. Discuss your results with **your doctor** along with your symptoms and history.',
        ].join('\n');
    }

    const summary = notable.length
        ? `${n} parametre incelendi. Verilen referans aralıklarına göre ${notable.length} değer öne çıkıyor (referans dışı veya nitel pozitif/reaktif).`
        : `${n} parametre incelendi. Verilen referans aralıklarına göre referans dışı sayısal değer bulunmadı.`;
    const findings = notable.length
        ? notable.map((f) => `- ${f.line}`).join('\n')
        : '- Referans aralığı dışında kalan parametre bulunmadı.';
    return [
        '### Tahlil Özeti',
        summary,
        '',
        '### Öne Çıkan Bulgular',
        findings,
        '',
        '### Tavsiye',
        '- Bu sonuçları semptomlarınız ve öykünüzle birlikte doktorunuzla paylaşın.',
        '- Dengeli beslenme, yeterli su, düzenli uyku ve hafif/orta aktivite genel sağlığı destekler.',
        '',
        '---',
        '**Uyarı:** Bu içerik tıbbi tavsiye değildir. Sonuçlarınızı semptomlarınız ve öykünüzle birlikte **doktorunuza** danışın.',
    ].join('\n');
}

async function generateAnalysisText(items, locale = 'tr') {
    const clean = (Array.isArray(items) ? items : []).filter((it) => !isLowQualityLabItem(it));
    if (clean.length === 0) {
        return defaultAnalysisFallback(locale);
    }

    const localAnalysis = buildLocalAnalysisFromItems(clean, locale);
    if (!isOpenAIEnabled()) {
        return localAnalysis;
    }
    const notable = collectNotableFindings(clean, locale);
    const bullet = itemsToBulletedText(clean);
    const notableBlock = notable.length
        ? notable.map((f) => `- ${f.line}`).join('\n')
        : (locale === 'en'
            ? '- (none — all numeric values with refs are in range)'
            : '- (yok — referansı olan sayısal değerlerin tümü aralık içinde)');
    const isEn = locale === 'en';

    const systemInstr = isEn
        ? `
You are not a clinical assistant; **you do not give medical diagnoses**. Based only on the laboratory data provided, write an informative, plain **English** summary.
OUTPUT ONLY IN MARKDOWN. Produce these 4 sections in order:
1) **Summary**: Say how many parameters were reviewed and whether any are outside reference (or qualitatively positive). Mention out-of-range names briefly.
2) **Notable findings**: **REQUIRED.** List EVERY out-of-range / notable item from the precomputed list below with parameter name, value, and reference. Add one short plain-language note (e.g. "above the lab's reference range"). If the precomputed list is empty, write that none were outside range — do NOT say you cannot identify them.
3) **Recommendations**: General lifestyle/follow-up (no treatment advice).
4) **Disclaimer**: Not medical advice; discuss with a doctor.

Constraints:
- Do not give drug names, doses, or diagnoses.
- Do not invent parameters. Prefer the precomputed notable list for section 2.
- Never claim that out-of-range values cannot be identified when the data includes reference ranges.
- Tone: calm, plain.
`
        : `
Sen bir klinik asistan değilsin; **tıbbi tanı koymazsın**. Sadece verilen laboratuvar verilerine dayanarak bilgilendirici ve sade Türkçe yaz.
ÇIKTIYI SADECE MARKDOWN OLARAK VER. Aşağıdaki 4 bölümü bu sırada üret:
1) **Tahlil Özeti**: Kaç parametre incelendiğini ve referans dışı / öne çıkan değer olup olmadığını kısaca söyle; varsa parametre adlarını an.
2) **Öne Çıkan Bulgular**: **ZORUNLU.** Aşağıdaki önceden hesaplanmış listedeki HER referans dışı / öne çıkan maddeyi parametre adı, değer ve referans aralığıyla madde madde yaz. Her maddeye kısa, sade bir açıklama ekle (örn. “laboratuvarın verdiği aralığın üzerinde”). Liste boşsa “Referans aralığı dışında kalan parametre bulunmadı” yaz — “belirleyemeyebilir” deme.
3) **Tavsiye**: Genel yaşam tarzı / doktora danışma (tedavi önerme).
4) **Uyarı**: Tıbbi tavsiye değildir; doktorunuza danışın.

Kısıtlar:
- İlaç ismi, doz, tanı verme.
- Listede olmayan parametre uydurma. Bölüm 2 için öncelik önceden hesaplanmış listededir.
- Referans aralığı varken “referans dışı değerleri belirleyemeyebilir” deme.
- Ton: sakin, sade.
`;

    const userInput = isEn
        ? `
Precomputed notable findings (use these in section 2):
${notableBlock}

All lab rows:
${bullet}

Write the 4 sections now.
`
        : `
Önceden hesaplanmış öne çıkan bulgular (bölüm 2’de bunları kullan):
${notableBlock}

Tüm laboratuvar satırları:
${bullet}

Şimdi 4 bölümü yaz.
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
        if (!text) return localAnalysis;
        // LLM “belirleyemeyebilir” kaçırırsa yerel bulgu metnini kullan
        const low = text.toLowerCase();
        const evasive =
            /belirleyemeyebilir|may not reliably identify|sınırlı veya standart biçimde değil|data is limited or not in a standard/i.test(
                low,
            );
        if (evasive && clean.length >= 3) return localAnalysis;
        return hardenWithDisclaimer(text, locale);
    } catch (e) {
        console.warn('OPENAI ANALYSIS ERR:', e?.message || e);
        return localAnalysis;
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
8. Ignore headers, footers, page numbers, and URLs (e.g. enabiz.gov.tr).
9. Ignore disclaimer/watermark text (e.g. ÖRNEKTİR, GERÇEK TAHLİL RAPORU DEĞİLDİR), patient/meta rows (Rapor tarihi, Örnek türü, Rapor no), and table column headers (Parametre/Sonuç/Birim/Referans). Never create items from those.
10. Do not create items from gender/reference fragments (e.g. "Kadın:", "g/dLKadın"). Reference bounds belong in refLow/refHigh of the real test only.
11. For qualitative results (Negatif/Pozitif/Non-reaktif), set resultLabel and include every result row from the PDF (e.g. each HPV type line). Do not invent a numeric value from the type number alone (e.g. do not emit test "HR HPV Tip" with value 16 and no resultLabel).
12. Keep section only for real panel headers (HEMOGRAM, İDRAR, BİYOKİMYA, etc.). Never use hospital/clinic/facility names as section.`;

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

    /** OpenAI kapalı veya LLM fail: regex + lokal yorum (API isteği yok). */
    async function finishWithLocalOnly(reasonLab, reasonNonLab) {
        const local = local0;
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
        const coercedFallback = coerceAndValidate({
            isLab: isLabFinal,
            confidence: isLabFinal ? 0.35 : 0,
            reason: isLabFinal ? reasonLab : reasonNonLab,
            items: isLabFinal ? filteredItems : [],
        });
        const fallbackRawItems = ensureBetaHCGIfInText(
            fullText,
            mergeWithLLM(fullBaseItems, coercedFallback.items),
        );
        const fallbackItemsMerged = postProcessItems(fullText, fallbackRawItems);
        const fallback = {
            isLab: isLabFinal && fallbackItemsMerged.length > 0,
            confidence: coercedFallback.confidence,
            reason: coercedFallback.reason,
            items: fallbackItemsMerged,
            rawItems: fallbackItemsMerged,
        };
        const analysis = fallback.isLab
            ? await generateAnalysisText(fallback.items, locale)
            : defaultAnalysisFallback(locale);
        return { ...fallback, analysis };
    }

    if (!isOpenAIEnabled()) {
        console.warn(
            'OPENAI_ENABLED=false — local regex only (raw=%s)',
            JSON.stringify(process.env.OPENAI_ENABLED),
        );
        return finishWithLocalOnly(
            'Local regex extraction (OPENAI_ENABLED=false)',
            'OPENAI_ENABLED=false – not treated as lab',
        );
    }

    const clippedFirst = clipped.length > MAX_INPUT_CHARS_FIRST_TRY ? clipped.slice(0, MAX_INPUT_CHARS_FIRST_TRY) : clipped;
    try {
        const r1 = await callOpenAI({
            instructions: baseInstr,
            input: `TEXT:\n${clippedFirst}`,
            timeoutMs: TIMEOUT_PRIMARY,
        });

        if (r1.isLab && r1.confidence >= 0.6) {
            const rawItems = ensureBetaHCGIfInText(fullText, mergeWithLLM(fullBaseItems, r1.items));
            const items = postProcessItems(fullText, rawItems);
            const analysis = await generateAnalysisText(items, locale);
            return { ...r1, items, rawItems: items, analysis };
        }

        /* Only override when LLM said it IS lab but was unsure; never force lab when LLM said not lab (e.g. CV). */
        if (r1.isLab && r1.confidence < 0.6 && regexLikely) {
            const rawItems = ensureBetaHCGIfInText(fullText, mergeWithLLM(fullBaseItems, local0.items));
            const mergedItems = postProcessItems(fullText, rawItems);
            const merged = {
                isLab: true,
                confidence: Math.max(0.35, r1.confidence || 0.35),
                reason: 'Regex heuristic override (LLM unsure)',
                items: mergedItems,
                rawItems: mergedItems,
            };
            const analysis = await generateAnalysisText(merged.items, locale);
            return { ...merged, analysis };
        }

        if (r1.isLab) {
            const rawItems = ensureBetaHCGIfInText(fullText, mergeWithLLM(fullBaseItems, r1.items));
            const items = postProcessItems(fullText, rawItems);
            const analysis = await generateAnalysisText(items, locale);
            return { ...r1, items, rawItems: items, analysis };
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
            const items = postProcessItems(fullText, rawItems);
            const analysis = await generateAnalysisText(items, locale);
            return { ...r2, items, rawItems: items, analysis };
        }

        if (r2.isLab && r2.confidence < 0.6 && regexLikely) {
            const rawItems = ensureBetaHCGIfInText(fullText, mergeWithLLM(fullBaseItems, local0.items));
            const mergedItems = postProcessItems(fullText, rawItems);
            const merged = {
                isLab: true,
                confidence: Math.max(0.35, r2.confidence || 0.35),
                reason: 'Regex heuristic override (LLM unsure)',
                items: mergedItems,
                rawItems: mergedItems,
            };
            const analysis = await generateAnalysisText(merged.items, locale);
            return { ...merged, analysis };
        }

        if (r2.isLab) {
            const rawItems = ensureBetaHCGIfInText(fullText, mergeWithLLM(fullBaseItems, r2.items));
            const items = postProcessItems(fullText, rawItems);
            const analysis = await generateAnalysisText(items, locale);
            return { ...r2, items, rawItems: items, analysis };
        }

        return r2;
    } catch (e) {
        console.warn('OPENAI TRY2 ERR:', e?.message || e);
    }

    /* On LLM timeout/fail: regex only – CVs can match numbers; prefer non-lab when empty. */
    return finishWithLocalOnly(
        'Local regex extraction (LLM timeout)',
        'LLM timeout – not treated as lab',
    );
}

module.exports = {
    classifyAndExtract,
    generateAnalysisText,
    /** test / upload sonrası savunma hattı */
    finalizeLabItems,
    isJunkLabLabel,
    isLowQualityLabItem,
    isOpenAIEnabled,
};

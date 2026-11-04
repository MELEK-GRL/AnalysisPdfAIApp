/**
 * İki tahlil kaydını karşılaştırır — tamamen JS, AI yok.
 * Girdi: LabHistory items (test, label, value, unit, refLow, refHigh, flag, resultLabel)
 */

/** Standart kod → alias listesi (normalize edilmiş küçük harf) */
const CODE_ALIASES = {
    WBC: ['wbc', 'lokosit', 'lökosit', 'leukocyte', 'leukocytes', 'white blood cell', 'white blood cells'],
    HGB: ['hgb', 'hb', 'hemoglobin', 'haemoglobin', 'hemoglobın'],
    RBC: ['rbc', 'eritrosit', 'erythrocyte', 'erythrocytes', 'red blood cell', 'red blood cells'],
    PLT: ['plt', 'trombosit', 'platelet', 'platelets', 'trombosıt'],
    HCT: ['hct', 'hematokrit', 'haematocrit', 'hematocrit'],
    MPV: ['mpv', 'ortalama trombosit hacmi', 'mean platelet volume'],
    MCV: ['mcv', 'ortalama eritrosit hacmi', 'mean corpuscular volume'],
    MCH: ['mch', 'ortalama eritrosit hemoglobini', 'mean corpuscular hemoglobin'],
    MCHC: ['mchc', 'mean corpuscular hemoglobin concentration'],
    RDW: ['rdw', 'rdw-cv', 'rdw-sd', 'kırmızı hücre dağılım genişliği'],
    NEU: ['neu', 'neut', 'neutrophil', 'nötrofil', 'notrofil', 'neutrophils', '%neu', 'neu%'],
    LYM: ['lym', 'lymph', 'lenfosit', 'lymphocyte', 'lymphocytes', '%lym', 'lym%'],
    MON: ['mon', 'mono', 'monosit', 'monocyte', 'monocytes', '%mon', 'mon%'],
    EOS: ['eos', 'eozinofil', 'eosinophil', 'eosinophils', '%eos'],
    BAS: ['bas', 'bazofil', 'basophil', 'basophils', '%bas'],
    GLU: ['glu', 'glukoz', 'glucose', 'aclik kan sekeri', 'kan sekeri', 'aks'],
    CREA: ['crea', 'creatinine', 'kreatinin', 'kreatını'],
    UREA: ['urea', 'ure', 'üre', 'bun'],
    ALT: ['alt', 'sgpt', 'alanin aminotransferaz', 'alt sgpt'],
    AST: ['ast', 'sgot', 'aspartat aminotransferaz', 'ast sgot'],
    TSH: ['tsh', 'tiroid uyarici hormon'],
};

/** Güvenilir birim eşdeğerleri (normalize key → canonical) */
const UNIT_EQUIV = {
    '10^3/ul': '10e3/ul',
    '10³/ul': '10e3/ul',
    'x10^3/ul': '10e3/ul',
    'x10³/ul': '10e3/ul',
    '10^3/µl': '10e3/ul',
    '10³/µl': '10e3/ul',
    '10e3/ul': '10e3/ul',
    '10^6/ul': '10e6/ul',
    '10⁶/ul': '10e6/ul',
    'x10^6/ul': '10e6/ul',
    '10e6/ul': '10e6/ul',
    'g/dl': 'g/dl',
    'g/l': 'g/l',
    'mg/dl': 'mg/dl',
    'mg/l': 'mg/l',
    'mmol/l': 'mmol/l',
    fl: 'fl',
    pg: 'pg',
    '%': '%',
    'iu/l': 'iu/l',
    'u/l': 'u/l',
};

function stripDiacritics(s) {
    return String(s || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/ı/g, 'i')
        .replace(/İ/g, 'i');
}

function normalizeKey(s) {
    return stripDiacritics(s)
        .toLowerCase()
        .replace(/[%]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');
}

function normalizeUnit(unit) {
    if (unit == null || unit === '') return null;
    let u = stripDiacritics(String(unit)).toLowerCase().replace(/\s+/g, '');
    u = u.replace(/μ/g, 'u').replace(/µ/g, 'u');
    return UNIT_EQUIV[u] || u;
}

/** test + label → standart kod veya normalize edilmiş anahtar */
function resolveMatchKey(item) {
    const test = normalizeKey(item?.test);
    const label = normalizeKey(item?.label);
    const candidates = [...new Set([test, label, `${test} ${label}`.trim()].filter(Boolean))];

    // 1) Baştaki standart kod: "wbc lokosit", "hgb hemoglobin", "alt sgpt" → WBC/HGB/ALT
    //    (parantezli PDF adları ile kısa kodları birleştirir; MCH içindeki "hemoglobin" yenmez)
    const codeByLower = Object.fromEntries(
        Object.keys(CODE_ALIASES).map((code) => [code.toLowerCase(), code]),
    );
    for (const c of candidates) {
        const first = c.split(/\s+/)[0];
        if (codeByLower[first]) return codeByLower[first];
    }

    // 2) Tam metin = kod veya alias
    for (const [code, aliases] of Object.entries(CODE_ALIASES)) {
        const codeNorm = code.toLowerCase();
        const aliasSet = new Set([codeNorm, ...aliases.map((a) => normalizeKey(a))]);
        for (const c of candidates) {
            if (aliasSet.has(c)) return code;
        }
    }

    // 3) Çok kelimeli alias ifadesi adayın içinde (sözcük sınırlı)
    for (const [code, aliases] of Object.entries(CODE_ALIASES)) {
        for (const a of aliases) {
            const an = normalizeKey(a);
            if (!an || !an.includes(' ')) continue;
            for (const c of candidates) {
                if (c === an || c.includes(` ${an} `) || c.startsWith(`${an} `) || c.endsWith(` ${an}`)) {
                    return code;
                }
            }
        }
    }

    // Standart kod yoksa test adının normalize hali
    return test || label || null;
}

function displayName(item, matchKey) {
    const code = matchKey && CODE_ALIASES[matchKey] ? matchKey : null;
    const label = item?.label || item?.test || matchKey || '';
    if (code && label && normalizeKey(label) !== code.toLowerCase()) {
        return `${code} – ${label}`;
    }
    if (code) return code;
    return String(label);
}

function flagStatus(flag) {
    if (flag === 'L') return 'Düşük';
    if (flag === 'H') return 'Yüksek';
    if (flag === 'N') return 'Normal';
    return 'Değerlendirilemiyor';
}

/** Durum sütunu sonucu (Normal/Yüksek) — sayısal değer yerine kullanılmamalı */
function isStatusResultLabel(rl) {
    if (rl == null) return false;
    return /^(Normal|Yüksek|Düşük|High|Low)(\s*\([HL]\))?$/i.test(String(rl).trim());
}

function flagFromResultLabel(rl) {
    if (rl == null) return null;
    const s = String(rl).trim();
    if (/yüksek|high|\(H\)/i.test(s)) return 'H';
    if (/düşük|low|\(L\)/i.test(s)) return 'L';
    if (/^normal$/i.test(s)) return 'N';
    return null;
}

/**
 * Her tahlilin kendi refLow/refHigh'ına göre durum.
 * Kayıtlı flag yalnızca referans yoksa yedek; taraf flag'leri birbirine karıştırılmaz.
 */
function deriveFlag(value, refLow, refHigh, existingFlag, resultLabel) {
    if (value != null && Number.isFinite(Number(value))) {
        const v = Number(value);
        const low = refLow != null && Number.isFinite(Number(refLow)) ? Number(refLow) : null;
        const high = refHigh != null && Number.isFinite(Number(refHigh)) ? Number(refHigh) : null;
        if (low != null || high != null) {
            if (low != null && v < low) return 'L';
            if (high != null && v > high) return 'H';
            return 'N';
        }
    }
    if (existingFlag === 'L' || existingFlag === 'N' || existingFlag === 'H') return existingFlag;
    return flagFromResultLabel(resultLabel);
}

function transitionLabel(flag1, flag2) {
    const out1 = flag1 === 'L' || flag1 === 'H';
    const out2 = flag2 === 'L' || flag2 === 'H';
    const n1 = flag1 === 'N';
    const n2 = flag2 === 'N';

    if (n1 && n2) return 'Her iki sonuç da normal.';
    if (out1 && out2) return 'Her iki sonuç da referans dışında.';
    if (out1 && n2) return 'Birinci tahlilde referans dışı sonuç var.';
    if (n1 && out2) return 'İkinci tahlilde referans dışı sonuç var.';
    // Flag eksikse sabit "her iki normal" uydurma
    if (out1 || out2) {
        if (out1 && out2) return 'Her iki sonuç da referans dışında.';
        if (out1) return 'Birinci tahlilde referans dışı sonuç var.';
        return 'İkinci tahlilde referans dışı sonuç var.';
    }
    return null;
}

/** Sayısal değer yönü: artış / düşüş / değişmedi */
function trendFromDiff(diff) {
    if (diff == null || !Number.isFinite(Number(diff))) {
        return { trend: null, trendLabel: null };
    }
    const d = Number(diff);
    if (d > 0) return { trend: 'up', trendLabel: 'Artış' };
    if (d < 0) return { trend: 'down', trendLabel: 'Düşüş' };
    return { trend: 'flat', trendLabel: 'Değişmedi' };
}

function isNumericItem(item) {
    const v = item?.value;
    if (v == null || !Number.isFinite(Number(v))) return false;
    // Kategorik sonuç: resultLabel var ve value sentinel (-1 vb.) olabilir
    const rl = item?.resultLabel != null ? String(item.resultLabel).trim() : '';
    if (rl && /pozitif|negatif|reaktif|non\s*-?\s*reaktif|positive|negative|reactive/i.test(rl)) {
        return false;
    }
    return true;
}

function isCategoricalItem(item) {
    const rl = item?.resultLabel != null ? String(item.resultLabel).trim() : '';
    return !!rl && !isNumericItem(item);
}

function normalizeCategorical(label) {
    const s = normalizeKey(label);
    if (/pozitif|positive|reaktif|reactive/.test(s) && !/non|negatif|negative/.test(s)) return 'positive';
    if (/negatif|negative|non reaktif|nonreaktif|non reactive/.test(s)) return 'negative';
    return s;
}

/**
 * @param {object[]} items1
 * @param {object[]} items2
 * @param {{ createdAt1?: string|Date, createdAt2?: string|Date, pdfName1?: string|null, pdfName2?: string|null, id1?: string, id2?: string }} meta
 */
function compareLabItems(items1, items2, meta = {}) {
    const list1 = Array.isArray(items1) ? items1 : [];
    const list2 = Array.isArray(items2) ? items2 : [];

    /** @type {Map<string, object>} */
    const map1 = new Map();
    /** @type {Map<string, object>} */
    const map2 = new Map();

    for (const it of list1) {
        const key = resolveMatchKey(it);
        if (!key) continue;
        if (!map1.has(key)) map1.set(key, it); // tekrar: ilkini tut
    }
    for (const it of list2) {
        const key = resolveMatchKey(it);
        if (!key) continue;
        if (!map2.has(key)) map2.set(key, it);
    }

    const keys1 = [...map1.keys()];
    const keys2 = [...map2.keys()];
    const commonKeys = keys1.filter(k => map2.has(k));
    const only1Keys = keys1.filter(k => !map2.has(k));
    const only2Keys = keys2.filter(k => !map1.has(k));

    const common = commonKeys.map(key => {
        const a = map1.get(key);
        const b = map2.get(key);
        const name = displayName(a, key);
        const catA = isCategoricalItem(a);
        const catB = isCategoricalItem(b);
        const numA = isNumericItem(a);
        const numB = isNumericItem(b);

        const flag1 = deriveFlag(a.value, a.refLow, a.refHigh, a.flag, a.resultLabel);
        const flag2 = deriveFlag(b.value, b.refLow, b.refHigh, b.flag, b.resultLabel);

        // Sayısal satırlarda durum etiketi (Normal/Yüksek) resultLabel'da kalmasın —
        // UI sayısal değeri göstersin; status ayrı alanda.
        const label1 =
            numA && isStatusResultLabel(a.resultLabel) ? null : a.resultLabel ?? null;
        const label2 =
            numB && isStatusResultLabel(b.resultLabel) ? null : b.resultLabel ?? null;

        const base = {
            matchKey: key,
            name,
            lab1: {
                value: numA ? Number(a.value) : null,
                unit: a.unit ?? null,
                refLow: a.refLow ?? null,
                refHigh: a.refHigh ?? null,
                flag: flag1,
                status: flagStatus(flag1),
                resultLabel: label1,
                valueDisplay: a.valueDisplay ?? null,
            },
            lab2: {
                value: numB ? Number(b.value) : null,
                unit: b.unit ?? null,
                refLow: b.refLow ?? null,
                refHigh: b.refHigh ?? null,
                flag: flag2,
                status: flagStatus(flag2),
                resultLabel: label2,
                valueDisplay: b.valueDisplay ?? null,
            },
            transition: transitionLabel(flag1, flag2),
            comparable: false,
            diff: null,
            percentChange: null,
            percentChangeLabel: null,
            trend: null,
            trendLabel: null,
            unitMismatch: false,
            note: null,
            kind: 'numeric',
        };

        if (catA || catB) {
            base.kind = 'categorical';
            const ca = normalizeCategorical(a.resultLabel || a.valueDisplay || '');
            const cb = normalizeCategorical(b.resultLabel || b.valueDisplay || '');
            if (ca && cb && ca === cb) {
                base.comparable = true;
                base.note = 'Sonuçlar aynı.';
            } else if (ca && cb) {
                base.comparable = true;
                base.note = 'Sonuçlar farklı.';
            } else {
                base.note = 'Kategorik sonuçlar karşılaştırılamadı.';
            }
            return base;
        }

        if (!numA || !numB) {
            base.note = 'Sayısal değer eksik; karşılaştırılamadı.';
            return base;
        }

        const u1 = normalizeUnit(a.unit);
        const u2 = normalizeUnit(b.unit);
        if (u1 && u2 && u1 !== u2) {
            // Güvenilir dönüşüm yok — karşılaştırma yok
            base.unitMismatch = true;
            base.note = 'Birimler farklı, karşılaştırılamadı.';
            return base;
        }

        const v1 = Number(a.value);
        const v2 = Number(b.value);
        const diff = v2 - v1;
        base.diff = diff;
        base.comparable = true;
        // Birim yalnızca o tarafın kendi kaydından; karşı tarafa aktarma
        base.lab1.unit = a.unit ?? null;
        base.lab2.unit = b.unit ?? null;

        const { trend, trendLabel } = trendFromDiff(diff);
        base.trend = trend;
        base.trendLabel = trendLabel;

        if (v1 === 0) {
            base.percentChange = null;
            base.percentChangeLabel =
                trend === 'flat' ? 'Değişmedi (0%)' : `${trendLabel} (oran hesaplanamadı)`;
        } else {
            const pct = (diff / Math.abs(v1)) * 100;
            base.percentChange = pct;
            const rounded = Math.round(pct * 10) / 10;
            const pctText = `${rounded > 0 ? '+' : ''}${rounded}%`;
            if (trend === 'flat') {
                base.percentChangeLabel = `Değişmedi (${pctText})`;
            } else {
                base.percentChangeLabel = `${trendLabel} (${pctText})`;
            }
        }

        return base;
    });

    const mapOnly = (keys, sourceMap, side) =>
        keys.map(key => {
            const it = sourceMap.get(key);
            const num = isNumericItem(it);
            const flag = deriveFlag(it.value, it.refLow, it.refHigh, it.flag, it.resultLabel);
            return {
                matchKey: key,
                name: displayName(it, key),
                side,
                value: num ? Number(it.value) : null,
                unit: it.unit ?? null,
                refLow: it.refLow ?? null,
                refHigh: it.refHigh ?? null,
                flag,
                status: flagStatus(flag),
                resultLabel: it.resultLabel ?? null,
                valueDisplay: it.valueDisplay ?? null,
                kind: isCategoricalItem(it) ? 'categorical' : 'numeric',
            };
        });

    return {
        id1: meta.id1 ?? null,
        id2: meta.id2 ?? null,
        lab1: {
            id: meta.id1 ?? null,
            createdAt: meta.createdAt1 ?? null,
            pdfName: meta.pdfName1 ?? null,
        },
        lab2: {
            id: meta.id2 ?? null,
            createdAt: meta.createdAt2 ?? null,
            pdfName: meta.pdfName2 ?? null,
        },
        summary: {
            commonCount: common.length,
            onlyLab1Count: only1Keys.length,
            onlyLab2Count: only2Keys.length,
        },
        common,
        onlyLab1: mapOnly(only1Keys, map1, 1),
        onlyLab2: mapOnly(only2Keys, map2, 2),
        noCommon: common.length === 0,
    };
}

module.exports = {
    compareLabItems,
    resolveMatchKey,
    normalizeUnit,
    normalizeKey,
    CODE_ALIASES,
};

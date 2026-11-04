const { compareLabItems, resolveMatchKey, normalizeUnit } = require('../src/utils/labCompare');

describe('labCompare', () => {
    test('WBC alias eşleşir (Lökosit ↔ WBC)', () => {
        expect(resolveMatchKey({ test: 'WBC', label: null })).toBe('WBC');
        expect(resolveMatchKey({ test: 'Lökosit', label: null })).toBe('WBC');
        expect(resolveMatchKey({ test: 'LOKOSIT', label: null })).toBe('WBC');
    });

    test('Parantezli ad ↔ kısa kod (WBC/HGB/ALT)', () => {
        expect(resolveMatchKey({ test: 'WBC (Lökosit)' })).toBe('WBC');
        expect(resolveMatchKey({ test: 'HGB (Hemoglobin)' })).toBe('HGB');
        expect(resolveMatchKey({ test: 'ALT (SGPT)' })).toBe('ALT');
        expect(resolveMatchKey({ test: 'AST (SGOT)' })).toBe('AST');
        expect(resolveMatchKey({ test: 'HGB' })).toBe('HGB');
        expect(resolveMatchKey({ test: 'WBC' })).toBe('WBC');
        // MCH içindeki hemoglobin HGB sanılmamalı
        expect(resolveMatchKey({ test: 'MCH' })).toBe('MCH');
        expect(resolveMatchKey({ test: 'Ortalama Eritrosit Hemoglobini' })).toBe('MCH');
    });

    test('Sentetik WBC/HGB ↔ Enabiz WBC/HGB ortak', () => {
        const a = [
            { test: 'WBC (Lökosit)', value: 6, unit: 'K/uL', refLow: 4, refHigh: 10, resultLabel: 'Normal' },
            { test: 'HGB (Hemoglobin)', value: 13, unit: 'g/dL', refLow: 12, refHigh: 16, resultLabel: 'Normal' },
            { test: 'ALT', value: 32, unit: 'U/L', refLow: 0, refHigh: 40, resultLabel: 'Normal' },
        ];
        const b = [
            { test: 'WBC', value: 4.19, unit: 'K/uL', refLow: 3.98, refHigh: 10.04 },
            { test: 'HGB', value: 12.7, unit: 'g/dL', refLow: 11.2, refHigh: 15.7 },
            { test: 'ALT (SGPT)', value: 20, unit: 'U/L', refLow: 0, refHigh: 33 },
            { test: 'MPV', value: 9.2, unit: 'fl', refLow: 9.4, refHigh: 12.3 },
        ];
        const r = compareLabItems(a, b);
        expect(r.summary.commonCount).toBe(3); // WBC, HGB, ALT
        expect(r.common.map((c) => c.matchKey).sort()).toEqual(['ALT', 'HGB', 'WBC']);
        expect(r.summary.onlyLab2Count).toBe(1); // MPV
        expect(r.summary.onlyLab1Count).toBe(0);
    });

    test('birim normalize: 10³/µL ≡ x10^3/uL', () => {
        expect(normalizeUnit('10³/µL')).toBe(normalizeUnit('x10^3/uL'));
    });

    test('1) İki tahlilde bütün parametreler aynı', () => {
        const items = [
            { test: 'WBC', label: 'Lökosit', value: 5.2, unit: '10^3/uL', refLow: 4, refHigh: 10, flag: 'N' },
            { test: 'HGB', label: 'Hemoglobin', value: 14, unit: 'g/dL', refLow: 12, refHigh: 16, flag: 'N' },
        ];
        const r = compareLabItems(items, items);
        expect(r.summary.commonCount).toBe(2);
        expect(r.summary.onlyLab1Count).toBe(0);
        expect(r.summary.onlyLab2Count).toBe(0);
        expect(r.common[0].diff).toBe(0);
        expect(r.common[0].percentChange).toBe(0);
        expect(r.common[0].trend).toBe('flat');
        expect(r.common[0].trendLabel).toBe('Değişmedi');
        expect(r.common[0].transition).toBe('Her iki sonuç da normal.');
    });

    test('2) Bazı parametreler ortak', () => {
        const a = [
            { test: 'WBC', value: 5, unit: '10^3/uL', refLow: 4, refHigh: 10, flag: 'N' },
            { test: 'PLT', value: 200, unit: '10^3/uL', refLow: 150, refHigh: 400, flag: 'N' },
        ];
        const b = [
            { test: 'Lökosit', value: 6, unit: '10^3/uL', refLow: 4, refHigh: 10, flag: 'N' },
            { test: 'GLU', label: 'Glukoz', value: 90, unit: 'mg/dL', refLow: 70, refHigh: 100, flag: 'N' },
        ];
        const r = compareLabItems(a, b);
        expect(r.summary.commonCount).toBe(1);
        expect(r.summary.onlyLab1Count).toBe(1);
        expect(r.summary.onlyLab2Count).toBe(1);
        expect(r.common[0].matchKey).toBe('WBC');
        expect(r.common[0].diff).toBe(1);
    });

    test('3) Hiç ortak parametre yok', () => {
        const a = [{ test: 'WBC', value: 5, unit: '10^3/uL', flag: 'N' }];
        const b = [{ test: 'GLU', value: 90, unit: 'mg/dL', flag: 'N' }];
        const r = compareLabItems(a, b);
        expect(r.noCommon).toBe(true);
        expect(r.summary.commonCount).toBe(0);
    });

    test('4) 10 → 20 yükselme, yüzde +100', () => {
        const a = [{ test: 'PLT', value: 10, unit: '10^3/uL', flag: 'N' }];
        const b = [{ test: 'PLT', value: 20, unit: '10^3/uL', flag: 'N' }];
        const r = compareLabItems(a, b);
        expect(r.common[0].diff).toBe(10);
        expect(r.common[0].percentChange).toBe(100);
        expect(r.common[0].trend).toBe('up');
        expect(r.common[0].trendLabel).toBe('Artış');
        expect(r.common[0].percentChangeLabel).toBe('Artış (+100%)');
    });

    test('4b) Değer düşüşü', () => {
        const a = [{ test: 'PLT', value: 20, unit: '10^3/uL', flag: 'N' }];
        const b = [{ test: 'PLT', value: 10, unit: '10^3/uL', flag: 'N' }];
        const r = compareLabItems(a, b);
        expect(r.common[0].trend).toBe('down');
        expect(r.common[0].trendLabel).toBe('Düşüş');
        expect(r.common[0].percentChangeLabel).toBe('Düşüş (-50%)');
    });

    test('5) Normal → Yüksek: durumlar karışmaz, geçiş metni dinamik', () => {
        const a = [{ test: 'HGB', value: 14, unit: 'g/dL', refLow: 12, refHigh: 16, flag: 'N', resultLabel: 'Normal' }];
        const b = [{ test: 'HGB', value: 18, unit: 'g/dL', refLow: 12, refHigh: 16, flag: 'N', resultLabel: 'Yüksek (H)' }];
        const r = compareLabItems(a, b);
        expect(r.common[0].lab1.value).toBe(14);
        expect(r.common[0].lab2.value).toBe(18);
        expect(r.common[0].lab1.status).toBe('Normal');
        expect(r.common[0].lab2.status).toBe('Yüksek');
        expect(r.common[0].lab1.resultLabel).toBeNull();
        expect(r.common[0].lab2.resultLabel).toBeNull();
        expect(r.common[0].transition).toBe('İkinci tahlilde referans dışı sonuç var.');
        expect(r.common[0].trend).toBe('up');
    });

    test('6) Yüksek → Normal dönüş', () => {
        const a = [{ test: 'HGB', value: 18, unit: 'g/dL', refLow: 12, refHigh: 16, flag: 'H' }];
        const b = [{ test: 'HGB', value: 14, unit: 'g/dL', refLow: 12, refHigh: 16, flag: 'N' }];
        const r = compareLabItems(a, b);
        expect(r.common[0].lab1.status).toBe('Yüksek');
        expect(r.common[0].lab2.status).toBe('Normal');
        expect(r.common[0].transition).toBe('Birinci tahlilde referans dışı sonuç var.');
        expect(r.common[0].trend).toBe('down');
    });

    test('WBC/HGB/PLT örnek: sayısal değer + kendi durumu', () => {
        const a = [
            { test: 'WBC', value: 5.2, unit: 'K/uL', refLow: 4, refHigh: 10, resultLabel: 'Normal' },
            { test: 'HGB', value: 12.0, unit: 'g/dL', refLow: 12, refHigh: 16, resultLabel: 'Normal' },
            { test: 'PLT', value: 250, unit: 'K/uL', refLow: 150, refHigh: 400, resultLabel: 'Normal' },
        ];
        const b = [
            { test: 'WBC', value: 11.2, unit: 'K/uL', refLow: 4, refHigh: 10, resultLabel: 'Yüksek (H)' },
            { test: 'HGB', value: 13.2, unit: 'g/dL', refLow: 12, refHigh: 16, resultLabel: 'Normal' },
            { test: 'PLT', value: 130, unit: 'K/uL', refLow: 150, refHigh: 400, resultLabel: 'Düşük (L)' },
        ];
        const r = compareLabItems(a, b);
        const by = Object.fromEntries(r.common.map((c) => [c.matchKey, c]));
        expect(by.WBC.lab1).toMatchObject({ value: 5.2, status: 'Normal' });
        expect(by.WBC.lab2).toMatchObject({ value: 11.2, status: 'Yüksek' });
        expect(by.WBC.transition).toBe('İkinci tahlilde referans dışı sonuç var.');
        expect(by.HGB.lab1.status).toBe('Normal');
        expect(by.HGB.lab2.status).toBe('Normal');
        expect(by.HGB.transition).toBe('Her iki sonuç da normal.');
        expect(by.PLT.lab1.status).toBe('Normal');
        expect(by.PLT.lab2.status).toBe('Düşük');
        expect(by.PLT.transition).toBe('İkinci tahlilde referans dışı sonuç var.');
    });

    test('7) Birimler farklı → karşılaştırılamadı', () => {
        const a = [{ test: 'HGB', value: 14, unit: 'g/dL', flag: 'N' }];
        const b = [{ test: 'HGB', value: 140, unit: 'g/L', flag: 'N' }];
        const r = compareLabItems(a, b);
        expect(r.common[0].unitMismatch).toBe(true);
        expect(r.common[0].comparable).toBe(false);
        expect(r.common[0].note).toMatch(/Birimler farklı/);
    });

    test('8) Referans aralığı eksik → uydurma yok', () => {
        const a = [{ test: 'WBC', value: 5, unit: '10^3/uL', refLow: null, refHigh: null, flag: null }];
        const b = [{ test: 'WBC', value: 6, unit: '10^3/uL', refLow: null, refHigh: null, flag: null }];
        const r = compareLabItems(a, b);
        expect(r.common[0].lab1.refLow).toBeNull();
        expect(r.common[0].lab1.refHigh).toBeNull();
        expect(r.common[0].lab1.status).toBe('Değerlendirilemiyor');
        expect(r.common[0].comparable).toBe(true);
        expect(r.common[0].diff).toBe(1);
    });

    test('9) Değer null / geçersiz → sayısal karşılaştırma yok', () => {
        const a = [{ test: 'WBC', value: null, unit: '10^3/uL', resultLabel: null }];
        const b = [{ test: 'WBC', value: 5, unit: '10^3/uL', flag: 'N' }];
        const r = compareLabItems(a, b);
        expect(r.common[0].comparable).toBe(false);
        expect(r.common[0].note).toMatch(/eksik/i);
    });

    test('10) Pozitif/Negatif kategorik', () => {
        const a = [{ test: 'HBsAg', value: -1, resultLabel: 'Negatif' }];
        const b = [{ test: 'HBsAg', value: -1, resultLabel: 'Pozitif' }];
        const r = compareLabItems(a, b);
        expect(r.common[0].kind).toBe('categorical');
        expect(r.common[0].note).toBe('Sonuçlar farklı.');
    });

    test('birinci değer 0 ise oran hesaplanamaz ama trend Artış', () => {
        const a = [{ test: 'PLT', value: 0, unit: '10^3/uL', flag: 'L' }];
        const b = [{ test: 'PLT', value: 5, unit: '10^3/uL', flag: 'L' }];
        const r = compareLabItems(a, b);
        expect(r.common[0].trend).toBe('up');
        expect(r.common[0].percentChangeLabel).toBe('Artış (oran hesaplanamadı)');
        expect(r.common[0].diff).toBe(5);
    });
});

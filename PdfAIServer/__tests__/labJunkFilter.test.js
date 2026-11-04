const { isJunkLabLabel, finalizeLabItems } = require('../src/services/openai');

describe('lab junk / meta filter', () => {
    test('Numune tarihi ve diğer meta etiketleri junk', () => {
        expect(isJunkLabLabel('Numune tarihi')).toBe(true);
        expect(isJunkLabLabel('Numune\ntarihi')).toBe(true);
        expect(isJunkLabLabel('Rapor tarihi')).toBe(true);
        expect(isJunkLabLabel('Hasta kodu')).toBe(true);
        expect(isJunkLabLabel('Rapor no')).toBe(true);
        expect(isJunkLabLabel('Rapor türü')).toBe(true);
        expect(isJunkLabLabel('Laboratuvar')).toBe(true);
        expect(isJunkLabLabel('Numune')).toBe(true);
    });

    test('gerçek tahlil adları junk değil', () => {
        expect(isJunkLabLabel('WBC (Lökosit)')).toBe(false);
        expect(isJunkLabLabel('HGB (Hemoglobin)')).toBe(false);
        expect(isJunkLabLabel('ALT')).toBe(false);
        expect(isJunkLabLabel('PLT (Trombosit)')).toBe(false);
    });

    test('finalizeLabItems Numune tarihi + 3.11 satırını eler', () => {
        const out = finalizeLabItems([
            {
                test: 'Numune tarihi',
                value: 3.11,
                unit: null,
                refLow: null,
                refHigh: null,
                flag: 'N',
                resultLabel: null,
            },
            {
                test: 'WBC (Lökosit)',
                value: 5.2,
                unit: 'K/uL',
                refLow: 4,
                refHigh: 10,
                flag: 'N',
                resultLabel: null,
            },
            {
                test: 'ALT',
                value: 48,
                unit: 'U/L',
                refLow: 0,
                refHigh: 40,
                flag: 'H',
                resultLabel: 'Yüksek (H)',
            },
            {
                test: 'Laboratuvar',
                value: 1,
                unit: null,
                resultLabel: null,
            },
        ]);
        const names = out.map((i) => i.test);
        expect(names).toEqual(['WBC (Lökosit)', 'ALT']);
        expect(names).not.toContain('Numune tarihi');
        expect(names).not.toContain('Laboratuvar');
    });

    test('Durum öneki yapışmış kopyaları birleştirir (Normal HGB → HGB)', () => {
        const out = finalizeLabItems([
            {
                test: 'HGB (Hemoglobin)',
                value: 12,
                unit: 'g/dL',
                refLow: 12,
                refHigh: 16,
                resultLabel: 'Normal',
            },
            {
                test: 'Normal HGB (Hemoglobin)',
                value: 12,
                unit: null,
                resultLabel: null,
            },
            {
                test: 'Yüksek (H) ALT',
                value: 48,
                unit: null,
                resultLabel: null,
            },
            {
                test: 'ALT',
                value: 48,
                unit: 'U/L',
                refLow: 0,
                refHigh: 40,
                resultLabel: 'Yüksek (H)',
            },
        ]);
        const names = out.map((i) => i.test).sort();
        expect(names).toEqual(['ALT', 'HGB (Hemoglobin)']);
        expect(out.find((i) => i.test === 'HGB (Hemoglobin)').unit).toBe('g/dL');
        expect(out.find((i) => i.test === 'ALT').unit).toBe('U/L');
    });

    test('Düşük (L) AST yapay adı AST ile birleşir — Test B senaryosu', () => {
        const out = finalizeLabItems([
            {
                test: 'WBC (Lökosit)',
                value: 12,
                unit: 'K/uL',
                refLow: 4,
                refHigh: 10,
                resultLabel: 'Yüksek (H)',
            },
            {
                test: 'HGB (Hemoglobin)',
                value: 11,
                unit: 'g/dL',
                refLow: 12,
                refHigh: 16,
                resultLabel: 'Düşük (L)',
            },
            {
                test: 'AST',
                value: 45,
                unit: 'U/L',
                refLow: 0,
                refHigh: 40,
                resultLabel: 'Yüksek (H)',
            },
            {
                test: 'Düşük (L) AST',
                value: 45,
                unit: 'U/L',
                resultLabel: null,
            },
            {
                test: 'Düşük(L)AST',
                value: 45,
                unit: null,
                resultLabel: null,
            },
        ]);
        expect(out).toHaveLength(3);
        const names = out.map((i) => i.test).sort();
        expect(names).toEqual(['AST', 'HGB (Hemoglobin)', 'WBC (Lökosit)']);
        expect(out.find((i) => i.test === 'AST').resultLabel).toBe('Yüksek (H)');
        expect(names.some((n) => /Düşük/i.test(n))).toBe(false);
    });
});

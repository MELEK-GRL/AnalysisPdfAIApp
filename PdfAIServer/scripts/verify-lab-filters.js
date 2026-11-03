/**
 * Sunucu restart gerekmeden filtre doğrulama (openai.js require).
 * Çalıştır: node scripts/verify-lab-filters.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

// Force re-load of modules under test by requiring after patch
const path = require('path');
const openaiPath = path.join(__dirname, '..', 'src', 'services', 'openai.js');
delete require.cache[require.resolve(openaiPath)];
delete require.cache[require.resolve(path.join(__dirname, '..', 'src', 'utils', 'normalizeSection.js'))];

const fs = require('fs');
const pdf = require('pdf-parse');
const { classifyAndExtract } = require('../src/services/openai');

function summarize(label, r) {
    const items = r.items || [];
    const junk = items.filter(
        (it) =>
            /ÖRNEK|ParametreSonuç|^L?Kadın$|g\/dLKadın|HR HPV Tip$/i.test(it.test || '') ||
            it.value === -1 ||
            (String(it.section || '').includes('POLİKLİN')),
    );
    return {
        label,
        confidence: r.confidence,
        count: items.length,
        junkCount: junk.length,
        junk: junk.map((j) => j.test),
        names: items.map((i) => i.test),
        plt: items.find((i) => /PLT/i.test(i.test || '')),
        sections: [...new Set(items.map((i) => i.section).filter(Boolean))],
    };
}

(async () => {
    const hemoPath =
        process.argv[2] ||
        '/Users/melek/.cursor/projects/Users-melek-Desktop-PdfAIAppProje/attachments/4c7dec9b-225a-42df-b9ab-9d4e53b1554f/ornek_hemogram_tahlil_sonucu.pdf';
    const hpvPath =
        process.argv[3] ||
        '/Users/melek/.cursor/projects/Users-melek-Desktop-PdfAIAppProje/attachments/4c7dec9b-225a-42df-b9ab-9d4e53b1554f/Enabiz-Tahlilleri_14.28.13.pdf';

    for (const [label, p] of [
        ['HEMO', hemoPath],
        ['HPV', hpvPath],
    ]) {
        if (!fs.existsSync(p)) {
            console.log(label, 'MISSING', p);
            continue;
        }
        const text = (await pdf(fs.readFileSync(p))).text;
        const r = await classifyAndExtract(text, 'tr');
        console.log(JSON.stringify(summarize(label, r), null, 2));
    }
})().catch((e) => {
    console.error(e);
    process.exit(1);
});

const fs = require('fs/promises');
const _pdfParse = require('pdf-parse');
const pdfParse = (typeof _pdfParse === 'function' ? _pdfParse : _pdfParse?.default);

if (typeof pdfParse !== 'function') {
    throw new Error('pdf-parse is not a function (check installed version)');
}

async function extractTextFromPdf(filePath) {
    const buf = await fs.readFile(filePath);
    if (!buf?.length) throw new Error('Uploaded file is empty');

    const parsed = await pdfParse(buf);
    const text = parsed?.text || '';

    if (!text.trim()) {
        throw new Error('No extractable text in PDF (likely scanned)');
    }
    return text;
}

module.exports = { extractTextFromPdf };

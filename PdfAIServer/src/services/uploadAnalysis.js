/**
 * Upload analiz servisi: PDF metni çıkarma, sınıflandırma, DB yazma.
 * Controller (route) rate limit ve multer ile dosyayı alır; bu servis iş mantığını yürütür.
 */
const { extractTextFromPdf } = require('./pdf');
const { classifyAndExtract } = require('./openai');
const Lab = require('../models/LatestLabResult');
const LabHistory = require('../models/LabHistory');
const { MAX_LAB_HISTORY_PER_USER } = require('../constants');

/**
 * PDF metninden tahlil sahibi/hasta adını çıkarır (yaygın etiketlere göre).
 * @param {string} text - PDF'den çıkan ham metin
 * @returns {string|null}
 */
function extractPatientName(text) {
    if (!text || typeof text !== 'string') return null;
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const labelPatterns = [
        /^(?:Hasta\s+Adı|Ad\s+Soyad|Adı\s+Soyadı|Hasta|İsim)\s*[:\s]+(.+)$/i,
        /^(?:Patient\s+Name|Name|Patient)\s*[:\s]+(.+)$/i,
    ];
    for (const line of lines) {
        for (const re of labelPatterns) {
            const m = line.match(re);
            if (m && m[1]) {
                const name = m[1].trim().replace(/\s+/g, ' ');
                if (name.length > 0 && name.length < 120 && !/^\d+$/.test(name)) return name;
            }
        }
    }
    return null;
}

/**
 * PDF dosyasını analiz eder; metin çıkarır, OpenAI ile sınıflandırır.
 * @param {string} tmpPath - Geçici PDF dosya yolu
 * @returns {Promise<{ type: string, confidence?: number, reason?: string, items: array, analysis?: string }>}
 */
async function runAnalysis(tmpPath, locale = 'tr') {
    let text = '';
    try {
        text = await extractTextFromPdf(tmpPath);
    } catch (ex) {
        const msg = String(ex?.message || '');
        if (/No extractable text/i.test(msg)) {
            return {
                type: 'non-lab',
                confidence: 0,
                reason: 'No text in PDF (likely scanned); OCR required',
                items: [],
                analysis: null,
            };
        }
        const err = new Error(msg || 'extract failed');
        err.code = 'PDF_READ_FAILED';
        throw err;
    }

    try {
        const result = await classifyAndExtract(text || '', locale);
        const patientName = extractPatientName(text);
        if (patientName) result.patientName = patientName;
        return result;
    } catch (ex) {
        const err = new Error(String(ex?.message || 'Analiz servisi hatası'));
        err.code = 'ANALYSIS_FAILED';
        throw err;
    }
}

/**
 * Kullanıcının geçmişini en güncel MAX_LAB_HISTORY_PER_USER adet ile sınırlar; fazlasını (en eskileri) siler.
 * @param {object} userId - Mongoose ObjectId
 */
async function trimLabHistoryForUser(userId) {
    try {
        const count = await LabHistory.countDocuments({ user: userId });
        if (count <= MAX_LAB_HISTORY_PER_USER) return;
        const toRemove = count - MAX_LAB_HISTORY_PER_USER;
        const oldest = await LabHistory.find({ user: userId })
            .sort({ createdAt: 1 })
            .limit(toRemove)
            .select('_id')
            .lean();
        const ids = oldest.map((d) => d._id);
        if (ids.length) await LabHistory.deleteMany({ _id: { $in: ids } });
    } catch (ex) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('TRIM LAB HISTORY ERR:', ex?.message || ex);
        }
    }
}

/**
 * Analiz sonucunu kullanıcıya ait LatestLabResult ve LabHistory olarak kaydeder.
 * Kullanıcı başına en fazla MAX_LAB_HISTORY_PER_USER (30) kayıt tutulur; aşılırsa en eskiler silinir.
 * @param {object} userId - Mongoose ObjectId
 * @param {object} result - runAnalysis çıktısı (isLab, items, analysis)
 * @param {string|null} pdfName - Orijinal PDF adı
 */
async function persistResult(userId, result, pdfName) {
    if (!result?.isLab || !Array.isArray(result.items)) return;
    try {
        await Lab.findOneAndUpdate(
            { user: userId },
            {
                $set: {
                    items: result.items,
                    analysis: result.analysis ?? null,
                },
                $setOnInsert: { user: userId },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        await LabHistory.create({
            user: userId,
            items: result.items,
            analysis: result.analysis ?? null,
            pdfName,
            patientName: result.patientName ?? null,
        });
        await trimLabHistoryForUser(userId);
    } catch (ex) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('DB ERR:', ex?.message || ex);
        }
    }
}

/**
 * Tek akış: analiz çalıştır, DB'ye yaz, API yanıtı formatında dön.
 * @param {string} tmpPath - Geçici PDF yolu
 * @param {object} userId - Mongoose ObjectId
 * @param {string|null} pdfName - Orijinal dosya adı
 * @param {string} [locale] - 'tr' | 'en' – tahlil yorumu dilini belirler
 */
async function analyzeAndSave(tmpPath, userId, pdfName, locale = 'tr') {
    const result = await runAnalysis(tmpPath, locale);
    await persistResult(userId, result, pdfName);
    return {
        type: result?.isLab ? 'lab' : 'non-lab',
        confidence: result?.confidence ?? null,
        reason: result?.reason ?? null,
        items: result?.items || [],
        /** 1. Aşama: PDF'den çıkarılan ham parametreler (bölüm atama / idrar-HPF düzeltmeleri uygulanmamış); UI'da aynen göstermek için. */
        rawItems: result?.rawItems ?? [],
        analysis: result?.analysis ?? null,
    };
}

module.exports = {
    runAnalysis,
    persistResult,
    analyzeAndSave,
};

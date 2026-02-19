const fs = require('fs');
const express = require('express');
const multer = require('multer');
const { classifyAndExtract } = require('../services/openai');
const { extractTextFromPdf } = require('../services/pdf');
const Lab = require('../models/LatestLabResult');
const LabHistory = require('../models/LabHistory');
const requireAuth = require('../middleware/requireAuth');
const {
    RATE_LIMIT_ANALYSIS_WINDOW_MS,
    RATE_LIMIT_ANALYSIS_MAX,
    TMP_DIR,
    MAX_UPLOAD_BYTES,
} = require('../constants');

const router = express.Router();

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, TMP_DIR),
    filename: (_req, file, cb) => {
        const safe = (file.originalname || 'upload.pdf').replace(/\s+/g, '_');
        cb(null, `${Date.now()}_${safe}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: MAX_UPLOAD_BYTES },
});

router.post('/', requireAuth, upload.single('file'), async (req, res) => {
    let tmpPath;
    try {
        if (!req.file) return res.status(400).json({ message: 'PDF gerekli' });

        // 0.5) Rate limit: 24h/2 analiz
        const since = new Date(Date.now() - RATE_LIMIT_ANALYSIS_WINDOW_MS);
        const count = await LabHistory.countDocuments({
            user: req.user._id,
            createdAt: { $gte: since },
        });
        if (count >= RATE_LIMIT_ANALYSIS_MAX) {
            return res.status(429).json({
                message: 'Günlük analiz limitine ulaştınız. 24 saat içinde en fazla 2 PDF analiz edebilirsiniz.',
                code: 'RATE_LIMIT_EXCEEDED',
            });
        }

        tmpPath = req.file.path;

        // 1) PDF metni
        let text = '';
        try {
            text = await extractTextFromPdf(tmpPath);
        } catch (ex) {
            const msg = String(ex?.message || '');
            console.warn('PDF EXTRACT WARN:', msg);
            if (/No extractable text/i.test(msg)) {
                return res.json({
                    type: 'non-lab',
                    confidence: 0,
                    reason: 'No text in PDF (likely scanned); OCR required',
                    items: [],
                    analysis: null,
                });
            }
            return res.status(400).json({ message: 'PDF okunamadı', detail: msg || 'extract failed' });
        }

        // 2) Sınıflandırma + analiz
        let result;
        try {
            result = await classifyAndExtract(text || '');
        } catch (ex) {
            const msg = String(ex?.message || '');
            console.error('OPENAI ERR:', msg);
            return res.status(502).json({ message: 'Analiz servisi hatası', detail: msg });
        }

        // 3) DB yaz — LatestLabResult (sadece lab), LabHistory (her analiz, rate limit için)
        const pdfName = req.file?.originalname ? String(req.file.originalname).replace(/\s+/g, '_') : null;

        try {
            if (result?.isLab && Array.isArray(result.items)) {
                await Lab.findOneAndUpdate(
                    { user: req.user._id },
                    {
                        $set: {
                            items: result.items,
                            analysis: result.analysis ?? null,
                        },
                        $setOnInsert: { user: req.user._id },
                    },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );
            }

            await LabHistory.create({
                user: req.user._id,
                items: result?.items || [],
                analysis: result?.analysis ?? null,
                pdfName,
            });
        } catch (ex) {
            console.error('DB ERR:', ex?.message || ex);
            // DB hatası olsa bile kullanıcıya yanıtı veriyoruz
        }

        // 4) Yanıt — analysis'ı mutlaka ekle
        return res.json({
            type: result?.isLab ? 'lab' : 'non-lab',
            confidence: result?.confidence ?? null,
            reason: result?.reason ?? null,
            items: result?.items || [],
            analysis: result?.analysis ?? null,
        });
    } catch (e) {
        console.error('UPLOAD ERR:', e?.message || e);
        return res.status(500).json({ message: 'Yükleme/analiz hatası', detail: e?.message || undefined });
    } finally {
        if (tmpPath) fs.unlink(tmpPath, () => { });
    }
});

module.exports = router;

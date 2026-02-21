const fs = require('fs');
const express = require('express');
const multer = require('multer');
const LabHistory = require('../models/LabHistory');
const requireAuth = require('../middleware/requireAuth');
const { analyzeAndSave } = require('../services/uploadAnalysis');
const {
    RATE_LIMIT_ANALYSIS_WINDOW_MS,
    RATE_LIMIT_ANALYSIS_MAX,
    RATE_LIMIT_ANALYSIS_DISABLED,
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
    fileFilter: (_req, file, cb) => {
        const ok = file.mimetype === 'application/pdf' ||
            (file.originalname && file.originalname.toLowerCase().endsWith('.pdf'));
        if (ok) return cb(null, true);
        cb(null, false);
    },
});

router.post('/', requireAuth, upload.single('file'), async (req, res) => {
    let tmpPath;
    try {
        if (!req.file) return res.status(400).json({ message: 'PDF gerekli' });

        // Sadece DEV'de limit kapalı; UAT ve PROD'da 2 analiz/24h zorunlu
        if (!RATE_LIMIT_ANALYSIS_DISABLED) {
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
        }

        tmpPath = req.file.path;
        const pdfName = req.file?.originalname ? String(req.file.originalname).replace(/\s+/g, '_') : null;

        let result;
        try {
            result = await analyzeAndSave(tmpPath, req.user._id, pdfName);
        } catch (err) {
            if (err.code === 'PDF_READ_FAILED') {
                return res.status(400).json({ message: 'PDF okunamadı', detail: err.message });
            }
            if (err.code === 'ANALYSIS_FAILED') {
                return res.status(502).json({ message: 'Analiz servisi hatası', detail: err.message });
            }
            throw err;
        }

        return res.json(result);
    } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('UPLOAD ERR:', e?.message || e);
        }
        return res.status(500).json({ message: 'Yükleme/analiz hatası', detail: e?.message || undefined });
    } finally {
        if (tmpPath) fs.unlink(tmpPath, () => { });
    }
});

module.exports = router;

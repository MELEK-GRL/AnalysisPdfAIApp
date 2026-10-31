const fs = require('fs');
const express = require('express');
const multer = require('multer');
const requireAuth = require('../middleware/requireAuth');
const { analyzeAndSave } = require('../services/uploadAnalysis');
const { assertCanAnalyze, consumeBonusIfNeeded } = require('../services/adsQuota');
const {
    RATE_LIMIT_ANALYSIS_DISABLED,
    TMP_DIR,
    MAX_UPLOAD_BYTES,
    ADS_ENABLED,
    ADMOB_REWARDED_UNIT_ID,
} = require('../constants');

const router = express.Router();

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, TMP_DIR),
    filename: (_req, file, cb) => {
        const safe = (file.originalname || 'upload.pdf').replace(/[()\s]+/g, '_').replace(/_+/g, '_') || 'upload.pdf';
        cb(null, `${Date.now()}_${safe}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: MAX_UPLOAD_BYTES },
    fileFilter: (_req, file, cb) => {
        const mimeOk = file.mimetype === 'application/pdf';
        const nameNorm = (file.originalname || '')
            .replace(/[()\s]+/g, '_')
            .toLowerCase();
        const nameOk = nameNorm.endsWith('.pdf');
        if (mimeOk || nameOk) return cb(null, true);
        cb(null, false);
    },
});

router.post('/', requireAuth, upload.single('file'), async (req, res) => {
    let tmpPath;
    try {
        if (!req.file) return res.status(400).json({ message: 'PDF gerekli' });

        let usedBonus = false;
        if (!RATE_LIMIT_ANALYSIS_DISABLED) {
            const gate = await assertCanAnalyze(req.user._id);
            if (!gate.ok) {
                return res.status(429).json({
                    message:
                        'Günlük analiz limitine ulaştınız. 24 saat içinde en fazla 2 PDF analiz edebilirsiniz' +
                        (ADS_ENABLED ? ' (2 reklam izleyerek +1 hak kazanabilirsiniz).' : '.'),
                    code: 'RATE_LIMIT_EXCEEDED',
                    adsEnabled: ADS_ENABLED,
                    rewardedUnitId: ADS_ENABLED ? ADMOB_REWARDED_UNIT_ID : null,
                    quota: gate.quota,
                });
            }
            usedBonus = gate.usedBonus;
        }

        tmpPath = req.file.path;
        const pdfName = req.file?.originalname ? String(req.file.originalname).replace(/\s+/g, '_') : null;
        const locale = (req.body?.locale === 'en' || req.get('X-App-Locale') === 'en' ? 'en' : 'tr');

        let result;
        try {
            result = await analyzeAndSave(tmpPath, req.user._id, pdfName, locale);
        } catch (err) {
            if (err.code === 'PDF_READ_FAILED') {
                return res.status(400).json({ message: 'PDF okunamadı', detail: err.message });
            }
            if (err.code === 'ANALYSIS_FAILED') {
                return res.status(502).json({ message: 'Analiz servisi hatası', detail: err.message });
            }
            throw err;
        }

        try {
            await consumeBonusIfNeeded(req.user._id, usedBonus);
        } catch (_) {
            /* ignore */
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

const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const { classifyAndExtract } = require('../services/openai');
const { extractTextFromPdf } = require('../services/pdf');
const Lab = require('../models/LatestLabResult');
const requireAuth = require('../middleware/requireAuth'); // koruma

const router = express.Router();

const TMP_DIR = path.join(__dirname, '..', '..', 'tmp');

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, TMP_DIR),
    filename: (_req, file, cb) => {
        const safe = (file.originalname || 'upload.pdf').replace(/\s+/g, '_');
        cb(null, `${Date.now()}_${safe}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 15 * 1024 * 1024 },
});

router.post('/', requireAuth, upload.single('file'), async (req, res) => {
    let tmpPath;
    try {
        // 0) guard
        if (!req.user?._id) return res.status(401).json({ message: 'Unauthorized' });
        if (!req.file) return res.status(400).json({ message: 'PDF gerekli' });

        tmpPath = req.file.path;
        console.log(
            '[UPLOAD]',
            'user=', String(req.user._id),
            'file=', tmpPath,
            'mime=', req.file.mimetype,
            'size=', req.file.size
        );

        // 1) PDF metni
        let text = '';
        try {
            text = await extractTextFromPdf(tmpPath);
            console.log('[UPLOAD] textLength=', text?.length ?? 0);
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
            console.log('[UPLOAD] classify=', {
                isLab: result?.isLab,
                confidence: result?.confidence,
                items: result?.items?.length,
                analysisLen: result?.analysis ? String(result.analysis).length : 0,
            });
        } catch (ex) {
            const msg = String(ex?.message || '');
            console.error('OPENAI ERR:', msg);
            return res.status(502).json({ message: 'Analiz servisi hatası', detail: msg });
        }

        // 3) DB yaz (sadece lab ise) — analysis'ı da kaydet
        try {
            if (result?.isLab && Array.isArray(result.items)) {
                await Lab.findOneAndUpdate(
                    { user: req.user._id },                 // <-- userId DEĞİL, user
                    {
                        $set: {
                            items: result.items,
                            analysis: result.analysis ?? null,
                        },
                        $setOnInsert: { user: req.user._id }, // <-- insert alanı: user
                    },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );
            }
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

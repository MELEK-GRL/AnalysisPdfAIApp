// src/routes/consents.js
console.log('>>> CONSENTS ROUTER LOADED');

const express = require('express');
const router = express.Router();
const Consent = require('../models/Consent');
const requireAuth = require('../middleware/requireAuth');

// -------------------------------------------------------
// Basit ping (test amaçlı)
// -------------------------------------------------------
router.get('/ping', (_req, res) => {
    console.log('PING endpoint hit');
    res.json({ ok: true, from: 'router' });
});

// -------------------------------------------------------
// Public: kullanıcı uygulamayı ilk açtığında onay verir
// -------------------------------------------------------
router.post('/accept', async (req, res) => {
    try {
        let { installationId, termsVersion, method, device } = req.body || {};
        installationId = String(installationId || '').trim();
        termsVersion = String(termsVersion || '').trim();
        method = String(method || 'checkbox');

        if (!installationId || !termsVersion) {
            return res.status(400).json({ message: 'installationId ve termsVersion gerekli' });
        }

        const ip = req.ip || req.headers['x-forwarded-for'] || null;
        const userAgent = req.get('user-agent') || '';

        const doc = await Consent.create({
            installationId,
            termsVersion,
            method,
            ip,
            userAgent,
            device: device || {},
        });

        return res.status(201).json({ ok: true, id: String(doc._id) });
    } catch (e) {
        console.error('CONSENT ACCEPT ERR:', e?.message || e);
        return res.status(500).json({ message: 'Consent kaydı oluşturulamadı' });
    }
});

// -------------------------------------------------------
// Protected: login sonrası consent'i kullanıcıya bağlar
// -------------------------------------------------------
router.post('/attach-by-installation', requireAuth, async (req, res) => {
    try {
        const installationId = String(req.body?.installationId || '').trim();
        if (!installationId) {
            return res.status(400).json({ message: 'installationId gerekli' });
        }

        const doc = await Consent.findOneAndUpdate(
            { installationId, user: { $in: [null, undefined] } },
            { $set: { user: req.user._id } },
            { new: true }
        ).lean();

        if (!doc) {
            return res.status(404).json({ message: 'Eşleşen consent bulunamadı' });
        }

        return res.json({ ok: true, id: String(doc._id) });
    } catch (e) {
        console.error('ATTACH-BY-INSTALLATION ERR:', e?.message || e);
        return res.status(500).json({ message: 'Attach başarısız' });
    }
});

// -------------------------------------------------------
// Protected: doğrudan id ile bağlama (opsiyonel)
// -------------------------------------------------------
router.post('/:id/attach', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await Consent.findOneAndUpdate(
            { _id: id },
            { $set: { user: req.user._id } },
            { new: true }
        ).lean();

        if (!updated) return res.status(404).json({ message: 'Consent bulunamadı' });
        return res.json({ ok: true });
    } catch (e) {
        console.error('CONSENT ATTACH ERR:', e?.message || e);
        return res.status(500).json({ message: 'Consent bağlanamadı' });
    }
});

module.exports = router;

const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const { sendSupportEmail } = require('../services/mail');

const router = express.Router();

const MAX_MESSAGE_LEN = 2000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/support
 * Body: { name, email, message }
 * Destek maili SUPPORT_INBOX'a gider; client alıcı adresini görmez.
 */
router.post('/', requireAuth, async (req, res) => {
    try {
        const name = String(req.body?.name || '').trim();
        const email = String(req.body?.email || '').trim().toLowerCase();
        const message = String(req.body?.message || '').trim();

        if (!name) {
            return res.status(400).json({ message: 'Kullanıcı adı gerekli' });
        }
        if (!email) {
            return res.status(400).json({ message: 'E-posta gerekli' });
        }
        if (!EMAIL_RE.test(email)) {
            return res.status(400).json({ message: 'Geçerli bir e-posta girin' });
        }
        if (!message) {
            return res.status(400).json({ message: 'Mesaj gerekli' });
        }
        if (message.length > MAX_MESSAGE_LEN) {
            return res.status(400).json({
                message: `Mesaj en fazla ${MAX_MESSAGE_LEN} karakter olabilir`,
            });
        }

        const user = req.user;
        const result = await sendSupportEmail({
            fromName: name,
            fromEmail: email,
            userId: user?._id?.toString?.() || String(user?._id || ''),
            message,
        });

        if (!result.sent) {
            return res.status(503).json({
                message:
                    'Destek mesajı şu an gönderilemedi. Lütfen daha sonra tekrar deneyin.',
                code: 'SUPPORT_SEND_FAILED',
            });
        }

        return res.json({ ok: true });
    } catch (e) {
        console.error('SUPPORT ERR:', e?.message || e);
        return res.status(500).json({
            message: 'Destek mesajı gönderilemedi',
            detail: e?.message,
        });
    }
});

module.exports = router;

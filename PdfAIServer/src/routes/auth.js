const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/user');
const PasswordReset = require('../models/passwordReset');
const ForgotPasswordAttempt = require('../models/ForgotPasswordAttempt');
const LabHistory = require('../models/LabHistory');
const LatestLabResult = require('../models/LatestLabResult');
const DeviceSession = require('../models/DeviceSession');
const Consent = require('../models/Consent');
const AppAnalytics = require('../models/AppAnalytics');
const requireAuth = require('../middleware/requireAuth');
const { sendPasswordResetEmail, sendPasswordResetCodeEmail } = require('../services/mail');
const { JWT_EXPIRES_IN, BCRYPT_ROUNDS } = require('../constants');

const RESET_CODE_EXPIRY_MS = 60 * 60 * 1000; // 1 saat (link için)
const RESET_CODE_6_DIGIT_EXPIRY_MS = 3 * 60 * 1000; // 3 dakika (6 haneli kod – süre dolunca hak düşer)
const FORGOT_PASSWORD_MAX_ATTEMPTS_PER_24H = 4;
const FORGOT_PASSWORD_24H_MS = 24 * 60 * 60 * 1000;

function generateResetToken() {
    return crypto.randomBytes(32).toString('hex');
}

/** 6 haneli şifre sıfırlama kodu (100000–999999) */
function generateResetCode() {
    return String(100000 + Math.floor(Math.random() * 900000));
}

const signToken = (user) =>
    jwt.sign({ sub: user._id, name: user.name }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const toSafeUser = (u) => ({ _id: u._id, name: u.name, email: u.email });

router.post('/register', async (req, res) => {
    try {
        let { name, email, password, termsAccepted } = req.body || {};
        name = typeof name === 'string' ? name.trim() : '';
        email = typeof email === 'string' ? email.trim().toLowerCase() : '';
        password = typeof password === 'string' ? password : '';
        const accepted = termsAccepted === true || termsAccepted === 'true';

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Missing fields' });
        }
        if (!accepted) {
            return res.status(400).json({ message: 'Terms must be accepted' });
        }

        const exists = await User.findOne({ email }).lean();
        if (exists) return res.status(409).json({ message: 'Email in use' });

        const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
        const user = await User.create({
            name,
            email,
            password: hash,
            termsAcceptedAt: new Date(),
        });

        const token = signToken(user);
        return res.status(201).json({ token, user: toSafeUser(user) });
    } catch (e) {
        console.error('REGISTER ERR:', e?.message || e);
        if (e?.stack) console.error('REGISTER ERR stack:', e.stack);
        return res.status(500).json({ message: 'Register failed' });
    }
});


router.post('/login', async (req, res) => {
    try {
        let { identifier, password } = req.body || {};
        identifier = typeof identifier === 'string' ? identifier.trim() : '';
        password = typeof password === 'string' ? password : '';

        if (!identifier || !password) {
            return res.status(400).json({ message: 'Missing credentials' });
        }

        const isEmail = identifier.includes('@');
        const query = isEmail
            ? { email: identifier.toLowerCase() }
            : { name: identifier };

        const user = await User.findOne(query).select('_id name email password');
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

        const token = signToken(user);
        return res.json({ token, user: toSafeUser(user) });
    } catch (e) {
        console.error('LOGIN ERR:', e?.message || e);
        if (e?.stack) console.error('LOGIN ERR stack:', e.stack);
        return res.status(500).json({ message: 'Login failed' });
    }
});

/** Şifremi unuttum: sadece e-posta yeterli, kullanıcı adı gerekmez. */
router.post('/forgot-password', async (req, res) => {
    try {
        console.log('[forgot-password] req.body:', JSON.stringify(req.body));
        let { email } = req.body || {};
        email = typeof email === 'string' ? email.trim().toLowerCase() : '';
        console.log('[forgot-password] email:', email || '(boş)');
        if (!email) {
            return res.status(400).json({ message: 'Email required' });
        }

        const user = await User.findOne({ email }).lean();
        console.log('[forgot-password] user bulundu:', !!user, user ? user.email : '-');
        if (!user) {
            return res.status(404).json({ ok: false, message: 'Email not registered' });
        }

        // 24 saatte en fazla 4 kod hakkı
        const since = new Date(Date.now() - FORGOT_PASSWORD_24H_MS);
        const attemptCount = await ForgotPasswordAttempt.countDocuments({ email, createdAt: { $gte: since } });
        console.log('[forgot-password] son 24h deneme:', attemptCount);
        if (attemptCount >= FORGOT_PASSWORD_MAX_ATTEMPTS_PER_24H) {
            return res.status(429).json({
                ok: false,
                message: 'FORGOT_PASSWORD_LIMIT_REACHED',
                code: 'FORGOT_PASSWORD_LIMIT_REACHED',
            });
        }

        // Eski sıfırlama kayıtlarını temizle, 6 haneli kod üret, kaydet, maile gönder
        await PasswordReset.deleteMany({ email });
        const code = generateResetCode();
        const expiresAt = new Date(Date.now() + RESET_CODE_6_DIGIT_EXPIRY_MS);
        await PasswordReset.create({ email, token: code, expiresAt });
        console.log('[forgot-password] kod oluşturuldu, mail gönderiliyor:', email);
        const mailResult = await sendPasswordResetCodeEmail(email, code);
        console.log('[forgot-password] mail sonucu:', mailResult?.sent, mailResult?.smtpConfigured, mailResult?.error || '-');

        if (!mailResult.sent) {
            if (mailResult.smtpConfigured) {
                await PasswordReset.deleteMany({ email });
                return res.status(503).json({
                    ok: false,
                    message: 'EMAIL_SERVICE_UNAVAILABLE',
                    code: 'EMAIL_SERVICE_UNAVAILABLE',
                });
            }
            if (process.env.NODE_ENV !== 'production') {
                console.log('[forgot-password] dev mod: kod döndürülüyor, devCode:', code);
                await ForgotPasswordAttempt.create({ email });
                return res.json({ ok: true, email, devCode: code });
            }
            await PasswordReset.deleteMany({ email });
            return res.status(503).json({
                ok: false,
                message: 'EMAIL_SERVICE_UNAVAILABLE',
                code: 'EMAIL_SERVICE_UNAVAILABLE',
            });
        }

        await ForgotPasswordAttempt.create({ email });
        console.log('[forgot-password] başarılı, 200 dönülüyor');
        return res.json({ ok: true, email });
    } catch (e) {
        console.error('FORGOT-PASSWORD ERR:', e?.message || e);
        return res.status(500).json({ message: 'Request failed' });
    }
});

/** E-posta + 6 haneli kod ile şifre sıfırlama (şifremi unuttum akışı) */
router.post('/reset-password-by-code', async (req, res) => {
    try {
        let { email, code, newPassword } = req.body || {};
        email = typeof email === 'string' ? email.trim().toLowerCase() : '';
        code = typeof code === 'string' ? code.trim() : '';
        newPassword = typeof newPassword === 'string' ? newPassword : '';
        if (!email || !code || !newPassword) {
            return res.status(400).json({ message: 'Email, code and new password required' });
        }
        if (!/^\d{6}$/.test(code)) {
            return res.status(400).json({ message: 'Invalid or expired code' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const reset = await PasswordReset.findOne({ email, token: code }).sort({ createdAt: -1 });
        if (!reset || reset.expiresAt < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired code' });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
        user.password = hash;
        await user.save();
        await PasswordReset.deleteOne({ _id: reset._id });

        return res.json({ message: 'Password updated. You can sign in with your new password.' });
    } catch (e) {
        console.error('RESET-PASSWORD-BY-CODE ERR:', e?.message || e);
        return res.status(500).json({ message: 'Reset failed' });
    }
});

router.post('/reset-password-by-email', async (req, res) => {
    try {
        let { email, newPassword } = req.body || {};
        email = typeof email === 'string' ? email.trim().toLowerCase() : '';
        newPassword = typeof newPassword === 'string' ? newPassword : '';
        if (!email || !newPassword) {
            return res.status(400).json({ message: 'Email and new password required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
        user.password = hash;
        await user.save();

        return res.json({ message: 'Password updated. You can sign in with your new password.' });
    } catch (e) {
        console.error('RESET-PASSWORD-BY-EMAIL ERR:', e?.message || e);
        return res.status(500).json({ message: 'Reset failed' });
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        let { token, newPassword } = req.body || {};
        token = typeof token === 'string' ? token.trim() : '';
        newPassword = typeof newPassword === 'string' ? newPassword : '';
        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Token and new password required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const reset = await PasswordReset.findOne({ token }).sort({ createdAt: -1 });
        if (!reset || reset.expiresAt < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired link' });
        }

        const user = await User.findOne({ email: reset.email });
        if (!user) return res.status(400).json({ message: 'User not found' });

        const hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
        user.password = hash;
        await user.save();
        await PasswordReset.deleteOne({ _id: reset._id });

        return res.json({ message: 'Password updated. You can sign in with your new password.' });
    } catch (e) {
        console.error('RESET-PASSWORD ERR:', e?.message || e);
        return res.status(500).json({ message: 'Reset failed' });
    }
});

router.get('/me', requireAuth, (req, res) => {
    try {
        return res.json({ user: toSafeUser(req.user) });
    } catch (e) {
        return res.status(500).json({ message: 'Me failed' });
    }
});
router.post('/session', requireAuth, async (req, res) => {
    try {
        return res.json({ ok: true });
    } catch (e) {
        console.error('SESSION ERR:', e?.message || e);
        return res.status(500).json({ message: 'Session failed' });
    }
});

/** Kullanıcı kendi hesabını siler. İlişkili veriler (lab, session, consent, analytics) silinir. */
router.delete('/account', requireAuth, async (req, res) => {
    try {
        const userId = req.user._id;
        await Promise.all([
            LabHistory.deleteMany({ user: userId }),
            LatestLabResult.deleteMany({ user: userId }),
            DeviceSession.deleteMany({ user: userId }),
            Consent.updateMany({ user: userId }, { $set: { user: null } }),
            AppAnalytics.updateMany({ user: userId }, { $set: { user: null } }),
            PasswordReset.deleteMany({ email: req.user.email }),
            ForgotPasswordAttempt.deleteMany({ email: req.user.email }),
        ]);
        await User.deleteOne({ _id: userId });
        return res.json({ success: true, message: 'Account deleted' });
    } catch (e) {
        console.error('DELETE ACCOUNT ERR:', e?.message || e);
        return res.status(500).json({ message: 'Account deletion failed' });
    }
});

module.exports = router;

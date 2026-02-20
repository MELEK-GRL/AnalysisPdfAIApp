const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/user');
const PasswordReset = require('../models/passwordReset');
const requireAuth = require('../middleware/requireAuth');
const { sendPasswordResetEmail } = require('../services/mail');
const { JWT_EXPIRES_IN, BCRYPT_ROUNDS } = require('../constants');

const RESET_CODE_EXPIRY_MS = 60 * 60 * 1000; // 1 saat
function generateResetToken() {
    return crypto.randomBytes(32).toString('hex');
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
        return res.status(500).json({ message: 'Login failed' });
    }
});

router.post('/forgot-password', async (req, res) => {
    try {
        let { email, name } = req.body || {};
        email = typeof email === 'string' ? email.trim().toLowerCase() : '';
        name = typeof name === 'string' ? name.trim() : '';
        if (!email || !name) {
            return res.status(400).json({ message: 'Email and username required' });
        }

        const user = await User.findOne({ email }).lean();
        if (!user) {
            return res.status(404).json({ ok: false, message: 'Email not registered' });
        }
        const userNameMatch = (user.name || '').trim().toLowerCase() === name.toLowerCase();
        if (!userNameMatch) {
            return res.status(400).json({ ok: false, message: 'Email and username do not match the same account' });
        }
        return res.json({ ok: true, email });
    } catch (e) {
        console.error('FORGOT-PASSWORD ERR:', e?.message || e);
        return res.status(500).json({ message: 'Request failed' });
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

module.exports = router;

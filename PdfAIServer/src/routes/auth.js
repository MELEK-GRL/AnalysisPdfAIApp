// routes/auth.js
const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const requireAuth = require('../middleware/requireAuth'); // sadece /me için

// Ortak yardımcılar
const signToken = (user) =>
    jwt.sign({ sub: user._id, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' });

const toSafeUser = (u) => ({ _id: u._id, name: u.name, email: u.email });

/**
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
    try {
        let { name, email, password } = req.body || {};
        name = typeof name === 'string' ? name.trim() : '';
        email = typeof email === 'string' ? email.trim().toLowerCase() : '';
        password = typeof password === 'string' ? password : '';

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Missing fields' });
        }

        // E-posta tekilliği
        const exists = await User.findOne({ email }).lean();
        if (exists) return res.status(409).json({ message: 'Email in use' });

        const hash = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hash });

        const token = signToken(user);
        return res.status(201).json({ token, user: toSafeUser(user) });
    } catch (e) {
        console.error('REGISTER ERR:', e?.message || e);
        return res.status(500).json({ message: 'Register failed' });
    }
});

/**
 * POST /api/auth/login
 * identifier: email veya kullanıcı adı
 */
router.post('/login', async (req, res) => {
    try {
        let { identifier, password } = req.body || {};
        identifier = typeof identifier === 'string' ? identifier.trim() : '';
        password = typeof password === 'string' ? password : '';

        if (!identifier || !password) {
            return res.status(400).json({ message: 'Missing credentials' });
        }

        // Email ise lowercase karşılaştır
        const isEmail = identifier.includes('@');
        const query = isEmail
            ? { email: identifier.toLowerCase() }
            : { name: identifier };

        // Şifre karşılaştırması için password alanını da çek
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

/**
 * GET /api/auth/me (korumalı)
 */
router.get('/me', requireAuth, (req, res) => {
    try {
        return res.json({ user: toSafeUser(req.user) });
    } catch (e) {
        return res.status(500).json({ message: 'Me failed' });
    }
});
router.post('/session', requireAuth, async (req, res) => {
    try {
        // İleride DeviceSession kaydı yapabilirsin; şimdilik OK dönelim.
        return res.json({ ok: true });
    } catch (e) {
        console.error('SESSION ERR:', e?.message || e);
        return res.status(500).json({ message: 'Session failed' });
    }
});

module.exports = router;

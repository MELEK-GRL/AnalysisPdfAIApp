// src/middleware/requireAuth.js
const jwt = require('jsonwebtoken');
const User = require('../models/user');

module.exports = async function requireAuth(req, res, next) {
    try {
        const h = req.headers?.authorization || '';
        const [type, raw] = h.split(' ');
        if (!/^bearer$/i.test(type) || !raw) {
            return res.status(401).json({ message: 'Missing/invalid Authorization header' });
        }

        const token = raw.replace(/^"|"$/g, ''); // "token" gelirse tırnakları temizle
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        // sub/id/userId sırasıyla dene
        const userId = payload.sub || payload.id || payload.userId;
        if (!userId) return res.status(401).json({ message: 'Invalid token payload' });

        const user = await User.findById(userId).select('_id name email').lean();
        if (!user) return res.status(401).json({ message: 'User not found' });

        req.user = user;                 // { _id, name, email }
        req.userId = String(user._id);   // kolay kullanım
        return next();
    } catch (e) {
        console.log('AUTH ERR:', e?.message);
        return res.status(401).json({ message: 'Invalid token' });
    }
};

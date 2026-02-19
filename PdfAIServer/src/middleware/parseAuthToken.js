/**
 * Parse Authorization header ve JWT ile kullanıcıyı çözümle.
 * @returns {{ user, userId } | null} Token geçerliyse user objesi, değilse null
 */
const jwt = require('jsonwebtoken');
const User = require('../models/user');

async function parseAuthToken(req) {
    try {
        const h = req.headers?.authorization || '';
        const [type, raw] = h.split(' ');
        if (!/^bearer$/i.test(type) || !raw) return null;

        const token = raw.replace(/^"|"$/g, '');
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const userId = payload.sub || payload.id || payload.userId;
        if (!userId) return null;

        const user = await User.findById(userId).select('_id name email').lean();
        if (!user) return null;

        return { user, userId: String(user._id) };
    } catch (_) {
        return null;
    }
}

module.exports = { parseAuthToken };

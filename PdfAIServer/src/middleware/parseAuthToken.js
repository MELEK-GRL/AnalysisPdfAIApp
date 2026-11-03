/**
 * Parse Authorization header ve JWT ile kullanıcıyı çözümle.
 * @returns {{ user, userId } | null} Token geçerliyse user objesi, değilse null
 */
const jwt = require('jsonwebtoken');
const User = require('../models/user');

function extractRawToken(req) {
    const h = req.headers?.authorization || '';
    if (h) {
        const [type, raw] = h.split(' ');
        if (/^bearer$/i.test(type) && raw) {
            return raw.replace(/^"|"$/g, '');
        }
    }

    // RN Android multipart/XHR bazen Authorization'ı düşürür; alternatif kanallar.
    const xAccess =
        req.headers?.['x-access-token'] ||
        req.headers?.['x-auth-token'] ||
        '';
    if (typeof xAccess === 'string' && xAccess.trim()) {
        const v = xAccess.trim().replace(/^"|"$/g, '');
        if (/^bearer\s+/i.test(v)) {
            return v.replace(/^bearer\s+/i, '').trim();
        }
        return v;
    }

    const q = req.query?.access_token;
    if (typeof q === 'string' && q.trim()) {
        return q.trim().replace(/^"|"$/g, '');
    }

    return null;
}

async function parseAuthToken(req) {
    try {
        const token = extractRawToken(req);
        if (!token) return null;

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

const { parseAuthToken } = require('./parseAuthToken');

/**
 * requireAuth ile aynı doğrulama yapar; token yoksa veya geçersizse hata dönmez, next() çağırır.
 */
module.exports = async function optionalAuth(req, res, next) {
    const parsed = await parseAuthToken(req);
    if (parsed) {
        req.user = parsed.user;
        req.userId = parsed.userId;
    }
    return next();
};

const { parseAuthToken } = require('./parseAuthToken');

module.exports = async function requireAuth(req, res, next) {
    const parsed = await parseAuthToken(req);
    if (!parsed) {
        return res.status(401).json({ message: 'Missing/invalid Authorization header' });
    }
    req.user = parsed.user;
    req.userId = parsed.userId;
    return next();
};

const rateLimit = require('express-rate-limit');

/** Kullanıcı başına 15 dakikada en fazla 120 analytics isteği (spam önleme). requireAuth sonrası çalışır, her zaman userId vardır. */
const analyticsRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 120,
    message: { message: 'Çok fazla istek. Lütfen biraz bekleyin.' },
    standardHeaders: true,
    keyGenerator: (req) => {
        if (req.userId) return req.userId.toString();
        if (req.user?._id) return req.user._id.toString();
        return 'anon';
    },
});

module.exports = analyticsRateLimit;

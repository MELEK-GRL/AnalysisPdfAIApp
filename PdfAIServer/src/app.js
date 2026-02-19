/**
 * Express app factory – test edilebilirlik için server başlatması ayrı tutuldu.
 * index.js bu modülü alıp Mongo bağlantısı ve listen yapar.
 */
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { randomUUID } = require('crypto');
const { TMP_DIR, EARLY_OK } = require('./constants');

const app = express();
app.set('trust proxy', false);

if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

app.get('/__early', (_req, res) => res.type('text').send(EARLY_OK));
app.get('/__routes', (_req, res) => {
    const routes = [];
    app._router?.stack?.forEach((m) => {
        if (m.route?.path) {
            routes.push({ path: m.route.path, methods: Object.keys(m.route.methods) });
        } else if (m.name === 'router' && m.handle?.stack) {
            m.handle.stack.forEach((h) => {
                if (h.route?.path) {
                    routes.push({ path: h.route.path, via: '(router)', methods: Object.keys(h.route.methods) });
                }
            });
        }
    });
    res.json({ count: routes.length, routes });
});

app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
    req.id = req.headers['x-request-id'] || randomUUID();
    next();
});

const requireAuth = require('./middleware/requireAuth');
const optionalAuth = require('./middleware/optionalAuth');
const authRoutes = require('./routes/auth');
const consentRoutes = require('./routes/consents');
const uploadRoutes = require('./routes/upload');
const labsRoutes = require('./routes/labs');
const analyticsRoutes = require('./routes/analytics');

app.use('/api/auth', authRoutes);
app.use('/api/consents', consentRoutes);
app.use('/api/upload', requireAuth, uploadRoutes);
app.use('/api/labs', requireAuth, labsRoutes);
app.use('/api/analytics', optionalAuth, analyticsRoutes);

app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));
app.use((req, res) => res.status(404).json({ message: 'Not found' }));

module.exports = app;

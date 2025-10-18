// src/index.js
// ─────────────────────────────────────────────
// 1) .env en başta
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// 2) importlar
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const { randomUUID } = require('crypto');

// 3) app
const app = express();
app.set('trust proxy', false);

// (opsiyonel) tmp klasörü garanti olsun (upload için)
const TMP_DIR = path.join(__dirname, '..', 'tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

// ─────────────────────────────────────────────
// BOOT INFO
console.log('BOOT', {
    cwd: process.cwd(),
    file: __filename,
    startedAt: new Date().toISOString(),
});

// ─────────────────────────────────────────────
// Erken teşhis endpointleri
app.get('/__early', (_req, res) => res.type('text').send('EARLY_OK'));
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

// ─────────────────────────────────────────────
/** Middleware */
app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basit istek logu
app.use((req, _res, next) => {
    req.id = req.headers['x-request-id'] || randomUUID();
    console.log(`[REQ] ${req.method} ${req.originalUrl}`);
    next();
});

// ─────────────────────────────────────────────
/** ROUTES */
const requireAuth = require('./middleware/requireAuth');
const authRoutes = require('./routes/auth');
const consentRoutes = require('./routes/consents');
const uploadRoutes = require('./routes/upload');
const labsRoutes = require('./routes/labs');

// Mount sırası
console.log('MOUNT /api/auth');
app.use('/api/auth', authRoutes);

console.log('MOUNT /api/consents');
app.use('/api/consents', consentRoutes);

console.log('MOUNT /api/upload');
app.use('/api/upload', requireAuth, uploadRoutes);

console.log('MOUNT /api/labs');
app.use('/api/labs', requireAuth, labsRoutes);

// Sağlık kontrolü
app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// 404 yakalayıcı (en sonda)
app.use((req, res) => res.status(404).json({ message: 'Not found' }));

// ─────────────────────────────────────────────
/** Mongo + server */
const PORT = Number(process.env.PORT || 4000);
const MONGODB_URI = process.env.MONGODB_URI;

(async function start() {
    if (!MONGODB_URI) {
        console.warn('⚠️  MONGODB_URI yok, Mongo atlanıyor.');
        app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT} (no Mongo)`));
        return;
    }

    try {
        mongoose.set('strictQuery', true);
        await mongoose.connect(MONGODB_URI, { dbName: process.env.DB_NAME || 'analysispdf' });
        console.log('✅ MongoDB connected');
        app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));
    } catch (err) {
        console.error('❌ Mongo error:', err?.message || err);
        process.exit(1);
    }
})();

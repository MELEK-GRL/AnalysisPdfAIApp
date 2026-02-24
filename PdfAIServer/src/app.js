/**
 * Express app factory – test edilebilirlik için server başlatması ayrı tutuldu.
 * index.js bu modülü alıp Mongo bağlantısı ve listen yapar.
 */
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { randomUUID } = require('crypto');
const { TMP_DIR, EARLY_OK } = require('./constants');

const app = express();
app.set('trust proxy', false);

if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

// Debug endpoint'leri sadece development'ta (production'da bilgi sızıntısı önleme)
if (process.env.NODE_ENV !== 'production') {
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
}

app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
// Production'da CLIENT_ORIGIN ile kısıtla (virgülle ayrılmış birden fazla origin olabilir)
const corsOrigin = process.env.CLIENT_ORIGIN
    ? process.env.CLIENT_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
    : '*';
app.use(cors({ origin: corsOrigin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
    req.id = req.headers['x-request-id'] || randomUUID();
    next();
});

const requireAuth = require('./middleware/requireAuth');
const optionalAuth = require('./middleware/optionalAuth');
const analyticsRateLimit = require('./middleware/analyticsRateLimit');
const authRoutes = require('./routes/auth');
const consentRoutes = require('./routes/consents');
const uploadRoutes = require('./routes/upload');
const labsRoutes = require('./routes/labs');
const analyticsRoutes = require('./routes/analytics');

app.use('/api/auth', authRoutes);
app.use('/api/consents', consentRoutes);
app.use('/api/upload', requireAuth, uploadRoutes);
app.use('/api/labs', requireAuth, labsRoutes);
app.use('/api/analytics', optionalAuth, analyticsRateLimit, analyticsRoutes);

app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// Gizlilik politikası – Play Store ve uygulama içi link (repo private kalabilir)
app.get('/privacy', (_req, res) => {
    try {
        const candidates = [
            path.join(__dirname, '..', 'public', 'privacy.html'),
            path.join(process.cwd(), 'public', 'privacy.html'),
        ];
        for (const htmlPath of candidates) {
            if (fs.existsSync(htmlPath)) {
                return res.type('html').send(fs.readFileSync(htmlPath, 'utf8'));
            }
        }
        // Dosya bulunamadıysa minimal inline sayfa (Railway path farklı olabilir)
        const fallback = '<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Gizlilik Politikası</title></head><body style="font-family:sans-serif;max-width:720px;margin:2rem auto;padding:0 1rem;"><h1>Gizlilik Politikası</h1><p><strong>PDF Tahlil Analizi</strong> uygulaması kullanıcı verilerini toplar, işler ve korur. Hesap bilgileri, tahlil PDF verileri (sağlık verisi – KVKK) ve teknik veriler işlenir. Analiz hizmeti için OpenAI (ABD) ile paylaşım yapılır. Bu uygulama bilgilendirme amaçlıdır; tıbbi tavsiye yerine geçmez. Detay için uygulama içi ayarlardan iletişime geçebilirsiniz.</p></body></html>';
        return res.type('html').send(fallback);
    } catch (e) {
        console.error('Privacy route error', e?.message || e);
        res.status(500).type('html').send('<!DOCTYPE html><html><body><h1>Geçici hata</h1><p>Lütfen daha sonra tekrar deneyin.</p></body></html>');
    }
});

// Hesap silme sayfası – Play Store Hesap silme URL'si gereksinimi
app.get('/delete-account', (_req, res) => {
    try {
        const candidates = [
            path.join(__dirname, '..', 'public', 'delete-account.html'),
            path.join(process.cwd(), 'public', 'delete-account.html'),
        ];
        for (const htmlPath of candidates) {
            if (fs.existsSync(htmlPath)) {
                return res.type('html').send(fs.readFileSync(htmlPath, 'utf8'));
            }
        }
        const fallback = '<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hesap Silme</title></head><body style="font-family:sans-serif;max-width:720px;margin:2rem auto;padding:0 1rem;"><h1>Hesap ve Veri Silme</h1><p><strong>PDF Tahlil Analizi</strong> uygulamasında hesabınızı silmek için: Uygulamayı açın → Profil → 「Hesabımı sil」. Hesap ve ilişkili veriler kalıcı olarak silinir. Detay için <a href="/privacy">Gizlilik Politikası</a>.</p></body></html>';
        return res.type('html').send(fallback);
    } catch (e) {
        console.error('Delete-account route error', e?.message || e);
        res.status(500).type('html').send('<!DOCTYPE html><html><body><h1>Geçici hata</h1><p>Lütfen daha sonra tekrar deneyin.</p></body></html>');
    }
});

// Merkezi hata yakalayıcı (route'lardan next(err) veya yakalanmamış hatalar)
app.use((err, _req, res, _next) => {
    const isProd = process.env.NODE_ENV === 'production';
    console.error('Unhandled error', isProd ? err?.message : err);
    const status = res.statusCode && res.statusCode >= 400 ? res.statusCode : 500;
    res.status(status).json({
        message: isProd ? 'Sunucu hatası' : (err?.message || 'Sunucu hatası'),
        ...(isProd ? {} : { stack: err?.stack }),
    });
});

app.use((req, res) => res.status(404).json({ message: 'Not found' }));

module.exports = app;

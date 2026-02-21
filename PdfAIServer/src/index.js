const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const app = require('./app');
const { DEFAULT_PORT, DEFAULT_DB_NAME } = require('./constants');

// Limit sadece production'da açık; dev/local (NODE_ENV boş veya development) ve DISABLE_RATE_LIMIT ile kapalı
const rateLimitDisabled = process.env.NODE_ENV !== 'production' ||
    process.env.DISABLE_RATE_LIMIT === 'true' || process.env.DISABLE_RATE_LIMIT === '1';

console.log('BOOT', {
    cwd: process.cwd(),
    file: __filename,
    startedAt: new Date().toISOString(),
    NODE_ENV: process.env.NODE_ENV || '(yok)',
    'Rate limit (24h/2)': rateLimitDisabled ? 'KAPALI (dev/uat dışı)' : 'AÇIK (prod)',
});

const PORT = Number(process.env.PORT || DEFAULT_PORT);
const MONGODB_URI = process.env.MONGODB_URI;
const isProduction = process.env.NODE_ENV === 'production';

// Production'da zorunlu env kontrolleri
if (isProduction) {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
        console.error('❌ Production için JWT_SECRET zorunludur (en az 16 karakter).');
        process.exit(1);
    }
    if (!MONGODB_URI) {
        console.error('❌ Production için MONGODB_URI zorunludur.');
        process.exit(1);
    }
}

const mongoOptions = {
    dbName: process.env.DB_NAME || DEFAULT_DB_NAME,
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 20000,
};

const MONGO_RETRY_COUNT = 3;
const MONGO_RETRY_DELAY_MS = 2000;

async function connectMongo() {
    for (let attempt = 1; attempt <= MONGO_RETRY_COUNT; attempt++) {
        try {
            mongoose.set('strictQuery', true);
            await mongoose.connect(MONGODB_URI, mongoOptions);
            console.log('✅ MongoDB connected');
            return true;
        } catch (err) {
            console.error(`❌ Mongo (deneme ${attempt}/${MONGO_RETRY_COUNT}):`, err?.message || err);
            if (attempt < MONGO_RETRY_COUNT) {
                console.log(`   ${MONGO_RETRY_DELAY_MS / 1000}s sonra tekrar denenecek...`);
                await new Promise((r) => setTimeout(r, MONGO_RETRY_DELAY_MS));
            } else {
                if (err?.stack) console.error('❌ Mongo stack:', err.stack);
                const isBadAuth = (err?.message || '').includes('bad auth') || (err?.message || '').includes('authentication failed');
                if (isBadAuth) {
                    console.error('\n📌 MONGODB BAD AUTH – YAPILACAKLAR:');
                    console.error('   1. https://cloud.mongodb.com → Database Access → kullanıcıyı seç → Edit');
                    console.error('   2. Edit Password → sadece harf ve rakam içeren yeni şifre belirle (örn. MyDbPass123)');
                    console.error('   3. PdfAIServer/.env içinde MONGODB_URI=... ile bağlantıdaki SIFRE kısmını bu yeni şifreyle değiştir');
                    console.error('      Format: mongodb+srv://KULLANICI:SIFRE@cluster.xxx.mongodb.net/...');
                    console.error('   4. Şifrede @ # $ % & + = varsa URL-encode edin: encodeURIComponent("sifreniz")\n');
                }
                if (isProduction) {
                    console.error('Production: MongoDB olmadan çalışmayı durduruyor.');
                    process.exit(1);
                }
            }
        }
    }
    return false;
}

async function start() {
    if (MONGODB_URI) {
        await connectMongo();
    } else {
        console.warn('⚠️  MONGODB_URI yok, Mongo atlanıyor.');
    }

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server listening on port ${PORT}`);
    });
}

start();

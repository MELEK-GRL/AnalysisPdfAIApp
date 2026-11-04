const path = require('path');
// Sadece lokal geliştirme: .env oku. Production / Railway’de değişkenler zaten process.env’de;
// dotenv.config() varsayılan olarak mevcut anahtarları ezmez ama production’da .env çağırmamak log kirliliğini ve kafa karışıklığını önler.
if (process.env.NODE_ENV !== 'production') {
    try {
        require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
    } catch (_) {
        /* dotenv paketi yoksa atla */
    }
}

const mongoose = require('mongoose');
const app = require('./app');
const { DEFAULT_PORT, DEFAULT_DB_NAME, RATE_LIMIT_ANALYSIS_DISABLED } = require('./constants');

const PORT = Number(process.env.PORT || DEFAULT_PORT);
const MONGODB_URI = (process.env.MONGODB_URI || '').trim();
const JWT_SECRET = (process.env.JWT_SECRET || '').trim();
const isProduction = process.env.NODE_ENV === 'production';

// Teşhis: değer yazmadan sadece varlık/uzunluk (Railway Variables debug)
const railwayInjected = !!(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_SERVICE_NAME);
console.log(
    '[env]',
    'NODE_ENV=',
    process.env.NODE_ENV || '(yok)',
    'JWT_SECRET len=',
    JWT_SECRET.length,
    'MONGODB_URI set=',
    !!MONGODB_URI,
    'OPENAI set=',
    !!(process.env.OPENAI_API_KEY || '').trim(),
    'RAILWAY_injected=',
    railwayInjected
);
if (isProduction && !JWT_SECRET) {
    const interesting = Object.keys(process.env)
        .filter((k) => /JWT|MONGO|OPENAI|RAILWAY_|SECRET|URI/i.test(k))
        .sort();
    console.error('[env] ilgili key isimleri:', interesting.join(', ') || '(hiçbiri)');
}

// Production'da zorunlu env kontrolleri
if (isProduction) {
    if (!JWT_SECRET || JWT_SECRET.length < 16) {
        console.error('❌ Production için JWT_SECRET zorunludur (en az 16 karakter).');
        console.error('   Railway → bu servis → Variables → JWT_SECRET ekle, sonra Redeploy.');
        console.error('   Root Directory boş olmalı (kök Dockerfile kullanıyorsan).');
        process.exit(1);
    }
    // Trim edilmiş değeri process.env'e geri yaz (jwt.sign aynı kaynağı kullansın)
    process.env.JWT_SECRET = JWT_SECRET;
    if (!MONGODB_URI) {
        console.error('❌ Production için MONGODB_URI zorunludur.');
        process.exit(1);
    }
    process.env.MONGODB_URI = MONGODB_URI;
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
            console.log('✅ MongoDB bağlandı (db:', mongoOptions.dbName + ')');
            return true;
        } catch (err) {
            console.error(`❌ Mongo (deneme ${attempt}/${MONGO_RETRY_COUNT}):`, err?.message || err);
            if (attempt < MONGO_RETRY_COUNT) {
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

    app.listen(PORT, '0.0.0.0');
}

start();

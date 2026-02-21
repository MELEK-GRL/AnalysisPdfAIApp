const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const app = require('./app');
const { DEFAULT_PORT, DEFAULT_DB_NAME } = require('./constants');

const rateLimitDisabled = process.env.NODE_ENV === 'development' ||
    process.env.DISABLE_RATE_LIMIT === 'true' || process.env.DISABLE_RATE_LIMIT === '1';

console.log('BOOT', {
    cwd: process.cwd(),
    file: __filename,
    startedAt: new Date().toISOString(),
    NODE_ENV: process.env.NODE_ENV || '(yok)',
    'Rate limit (24h/2)': rateLimitDisabled ? 'KAPALI (dev)' : 'AÇIK',
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

async function start() {
    if (MONGODB_URI) {
        try {
            mongoose.set('strictQuery', true);
            await mongoose.connect(MONGODB_URI, mongoOptions);
            console.log('✅ MongoDB connected');
        } catch (err) {
            console.error('❌ Mongo error:', err?.message || err);
            if (err?.stack) console.error('❌ Mongo stack:', err.stack);
            if (isProduction) {
                console.error('Production: MongoDB olmadan çalışmayı durduruyor.');
                process.exit(1);
            }
        }
    } else {
        console.warn('⚠️  MONGODB_URI yok, Mongo atlanıyor.');
    }

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server listening on port ${PORT}`);
    });
}

start();

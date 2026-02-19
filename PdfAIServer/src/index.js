const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const app = require('./app');
const { DEFAULT_PORT, DEFAULT_DB_NAME } = require('./constants');

console.log('BOOT', {
    cwd: process.cwd(),
    file: __filename,
    startedAt: new Date().toISOString(),
});

const PORT = Number(process.env.PORT || DEFAULT_PORT);
const MONGODB_URI = process.env.MONGODB_URI;

(async function start() {
    if (!MONGODB_URI) {
        console.warn('⚠️  MONGODB_URI yok, Mongo atlanıyor.');
        app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT} (no Mongo)`));
        return;
    }

    try {
        mongoose.set('strictQuery', true);
        await mongoose.connect(MONGODB_URI, { dbName: process.env.DB_NAME || DEFAULT_DB_NAME });
        console.log('✅ MongoDB connected');
        app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));
    } catch (err) {
        console.error('❌ Mongo error:', err?.message || err);
        process.exit(1);
    }
})();

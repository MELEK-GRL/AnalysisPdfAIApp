#!/usr/bin/env node
/**
 * Belirli bir e-posta için şifre sıfırlama denemelerini temizler (test için).
 * 24 saatte 4 hak sayacını sıfırlar.
 */
const path = require('path');
const fs = require('fs');

const projectRoot = path.resolve(__dirname, '..');
module.paths.unshift(path.join(projectRoot, 'node_modules'));

const envPath = path.join(projectRoot, '.env');
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
        const m = line.match(/^\s*([^#=]+)=(.*)$/);
        if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
    });
}

let mongoose, ForgotPasswordAttempt;
try {
    mongoose = require('mongoose');
    ForgotPasswordAttempt = require('../src/models/ForgotPasswordAttempt');
} catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
        process.exit(1);
    }
    throw e;
}

const email = process.argv[2];
if (!email) {
    process.exit(1);
}

const uri = process.env.MONGODB_URI;
if (!uri) {
    console.error('❌ MONGODB_URI .env dosyasında yok.');
    process.exit(1);
}

async function main() {
    await mongoose.connect(uri, { dbName: process.env.DB_NAME || 'analysispdf' });
    const normalized = email.trim().toLowerCase();
    const result = await ForgotPasswordAttempt.deleteMany({ email: normalized });
    console.log(`✅ ${result.deletedCount} adet şifre sıfırlama denemesi silindi: ${normalized}`);
    await mongoose.disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});

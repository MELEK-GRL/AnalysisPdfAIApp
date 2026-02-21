/**
 * MONGODB_URI'yi şifreyi göstermeden kontrol eder.
 * Kullanım: node scripts/check-mongo-uri.js
 */
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const uri = process.env.MONGODB_URI;

if (!uri) {
    console.log('❌ .env dosyasında MONGODB_URI tanımlı değil.');
    process.exit(1);
}

// mongodb+srv://USER:PASS@host/dbname?options
const match = uri.match(/^mongodb\+srv:\/\/([^:]+):([^@]+)@([^/]+)\/([^?]+)/);
if (!match) {
    console.log('❌ MONGODB_URI formatı hatalı. Beklenen: mongodb+srv://KULLANICI:SIFRE@cluster.xxx.mongodb.net/DB_ADI?...');
    process.exit(1);
}

const [, user, password, host, dbName] = match;
const needsEncode = /[@#$%&+=/?]/.test(password);

console.log('\n📋 MONGODB_URI özeti (şifre gösterilmiyor):');
console.log('   Kullanıcı adı:', user);
console.log('   Şifre uzunluğu:', password.length, 'karakter');
console.log('   Host:', host);
console.log('   Veritabanı:', dbName);
if (needsEncode) {
    console.log('\n⚠️  Şifrede @ # $ % & + = / ? var. URL-encode gerekebilir.');
    console.log('   Tarayıcı konsolunda: encodeURIComponent("sifreniz")');
} else {
    console.log('\n   Şifrede özel karakter yok (encode gerekmez).');
}
console.log('\n✅ Atlas\'ta Database Access\'te kullanıcı adı "' + user + '" ile eşleşmeli.');
console.log('   Şifre Atlas\'ta ne ise .env\'deki SIFRE kısmı da aynı olmalı.\n');

#!/usr/bin/env node
/**
 * SMTP ayarlarını kontrol eder. .env'deki SMTP_* değişkenlerini kullanır.
 * Kullanım: node scripts/check-smtp.js [test-email@example.com]
 * test-email verilirse o adrese örnek bir mail gönderilir.
 */
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const host = process.env.SMTP_HOST;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const port = Number(process.env.SMTP_PORT) || 587;
const secure = process.env.SMTP_SECURE === 'true';

if (!host || !user || !pass) {
    console.error('❌ SMTP yapılandırılmamış.');
    console.error('   PdfAIServer/.env dosyasına şunları ekleyin:');
    console.error('   SMTP_HOST=smtp.gmail.com');
    console.error('   SMTP_PORT=587');
    console.error('   SMTP_SECURE=false');
    console.error('   SMTP_USER=your-email@gmail.com');
    console.error('   SMTP_PASS=your-app-password');
    console.error('');
    console.error('   Gmail: Google Hesabı → Güvenlik → 2 adımlı doğrulama açık → Uygulama şifreleri');
    process.exit(1);
}

async function main() {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
    });

    console.log('SMTP bağlantısı deneniyor...', { host, port, secure, user: user.replace(/(.{2}).*(@.*)/, '$1***$2') });

    try {
        await transporter.verify();
        console.log('✅ SMTP bağlantısı başarılı.');
    } catch (err) {
        console.error('❌ SMTP bağlantı hatası:', err.message);
        if (err.message && err.message.includes('Invalid login')) {
            console.error('   Gmail kullanıyorsanız: Normal şifre yerine "Uygulama şifresi" kullanın.');
            console.error('   Google Hesabı → Güvenlik → 2 adımlı doğrulama → Uygulama şifreleri');
        }
        process.exit(1);
    }

    const testTo = process.argv[2];
    if (testTo) {
        console.log('Test e-postası gönderiliyor:', testTo);
        try {
            await transporter.sendMail({
                from: process.env.MAIL_FROM || user,
                to: testTo,
                subject: 'PdfAI – SMTP test',
                text: 'Bu bir test e-postasıdır. SMTP ayarlarınız çalışıyor.',
            });
            console.log('✅ Test e-postası gönderildi. Gelen kutusunu (ve spam\'i) kontrol edin.');
        } catch (err) {
            console.error('❌ Test mail gönderilemedi:', err.message);
            process.exit(1);
        }
    } else {
        console.log('Test mail göndermek için: node scripts/check-smtp.js your@email.com');
    }
}

main();

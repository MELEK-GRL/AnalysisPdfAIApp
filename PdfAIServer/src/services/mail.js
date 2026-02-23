/**
 * Şifre sıfırlama e-postası gönderir (link ile).
 * SMTP ayarları yoksa sadece konsola yazar.
 * RESET_LINK_BASE örn: pdfai://reset-password (deep link) veya https://example.com/reset
 */
async function sendPasswordResetEmail(email, token) {
    const base = process.env.RESET_LINK_BASE || 'pdfai://reset-password';
    const resetLink = base.includes('?') ? `${base}&token=${token}` : `${base}?token=${token}`;
    const subject = 'Şifre sıfırlama linki';
    const text = `Şifrenizi sıfırlamak için aşağıdaki linke tıklayın:\n\n${resetLink}\n\nBu link 1 saat geçerlidir.\n\nBu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.`;

    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
        try {
            const nodemailer = require('nodemailer');
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT) || 587,
                secure: process.env.SMTP_SECURE === 'true',
                auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
            });
            await transporter.sendMail({
                from: process.env.MAIL_FROM || process.env.SMTP_USER,
                to: email,
                subject,
                text,
            });
            return { sent: true };
        } catch (err) {
            console.error('Mail send error:', err?.message || err);
            return { sent: false, error: err?.message };
        }
    }

    if (process.env.NODE_ENV !== 'production') {
        console.log('[DEV] Password reset email (not sent – no SMTP):', { to: email, link: resetLink });
    }
    return { sent: false };
}

/**
 * Şifre sıfırlama kodu (6 haneli) e-postası gönderir.
 * Uygulama içinde kullanıcı bu kodu girerek şifresini değiştirir.
 */
async function sendPasswordResetCodeEmail(email, code) {
    const subject = 'Şifre sıfırlama kodunuz';
    const text = `Şifre sıfırlama kodunuz: ${code}\n\nBu kod 3 dakika geçerlidir. 3 dakika içinde uygulama içinde bu kodu girip şifrenizi yenilemeniz gerekir; aksi halde kod geçersiz olur.\n\nBu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.`;

    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
        try {
            console.log('[Mail] Şifre sıfırlama kodu gönderiliyor:', email);
            const nodemailer = require('nodemailer');
            const port = Number(process.env.SMTP_PORT) || 587;
            const secure = process.env.SMTP_SECURE === 'true';
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port,
                secure,
                auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
            });
            await transporter.sendMail({
                from: process.env.MAIL_FROM || process.env.SMTP_USER,
                to: email,
                subject,
                text,
            });
            console.log('[Mail] Şifre sıfırlama kodu gönderildi:', email);
            return { sent: true };
        } catch (err) {
            console.error('[Mail] Gönderim hatası:', err?.message || err);
            if (err?.response) console.error('[Mail] SMTP yanıt:', err.response);
            return { sent: false, smtpConfigured: true, error: err?.message };
        }
    }

    if (process.env.NODE_ENV !== 'production') {
        console.log('[DEV] Password reset code email (not sent – no SMTP):', { to: email, code });
    }
    return { sent: false, smtpConfigured: false };
}

module.exports = { sendPasswordResetEmail, sendPasswordResetCodeEmail };

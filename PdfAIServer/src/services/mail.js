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

    console.log('[DEV] Password reset email (not sent – no SMTP):', { to: email, link: resetLink });
    return { sent: false };
}

module.exports = { sendPasswordResetEmail };

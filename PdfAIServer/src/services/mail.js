/**
 * E-posta gönderimi (şifre sıfırlama + destek).
 * SMTP yoksa development'ta log; production'da sent:false.
 */

function getSmtpAuth() {
    const host = (process.env.SMTP_HOST || '').trim();
    const user = (process.env.SMTP_USER || '').trim();
    // Gmail uygulama şifresi UI'da boşluklu gelebilir
    const pass = String(process.env.SMTP_PASS || '').replace(/\s+/g, '');
    return { host, user, pass };
}

function createTransporter(overrides = {}) {
    const nodemailer = require('nodemailer');
    const { host, user, pass } = getSmtpAuth();
    const port = Number(overrides.port ?? process.env.SMTP_PORT) || 587;
    const secure =
        overrides.secure !== undefined
            ? overrides.secure
            : process.env.SMTP_SECURE === 'true';

    return nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        connectionTimeout: 12000,
        greetingTimeout: 12000,
        socketTimeout: 20000,
        tls: { minVersion: 'TLSv1.2' },
    });
}

async function sendWithSmtp({ to, subject, text, replyTo }) {
    const { host, user, pass } = getSmtpAuth();
    if (!host || !user || !pass) {
        return { sent: false, smtpConfigured: false };
    }

    const from = process.env.MAIL_FROM || user;
    const attempts = [
        {
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
        },
        // Railway / bazı ağlarda 587 takılırsa SSL 465 dene
        { port: 465, secure: true },
    ];

    // Aynı port iki kez denenmesin
    const seen = new Set();
    const unique = attempts.filter((a) => {
        const key = `${a.port}:${a.secure}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    let lastError;
    for (const cfg of unique) {
        try {
            const transporter = createTransporter(cfg);
            await transporter.sendMail({
                from,
                to,
                replyTo: replyTo || undefined,
                subject,
                text,
            });
            return { sent: true, smtpConfigured: true, port: cfg.port };
        } catch (err) {
            lastError = err;
            console.error(
                `[Mail] SMTP ${cfg.port}/${cfg.secure ? 'ssl' : 'starttls'} hata:`,
                err?.message || err,
            );
        }
    }

    return {
        sent: false,
        smtpConfigured: true,
        error: lastError?.message || 'SMTP send failed',
    };
}

/**
 * Şifre sıfırlama e-postası gönderir (link ile).
 */
async function sendPasswordResetEmail(email, token) {
    const base = process.env.RESET_LINK_BASE || 'pdfai://reset-password';
    const resetLink = base.includes('?')
        ? `${base}&token=${token}`
        : `${base}?token=${token}`;
    const subject = 'Şifre sıfırlama linki';
    const text = `Şifrenizi sıfırlamak için aşağıdaki linke tıklayın:\n\n${resetLink}\n\nBu link 1 saat geçerlidir.\n\nBu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.`;

    return sendWithSmtp({ to: email, subject, text });
}

/**
 * Şifre sıfırlama kodu (6 haneli) e-postası gönderir.
 */
async function sendPasswordResetCodeEmail(email, code) {
    const subject = 'Şifre sıfırlama kodunuz';
    const text = `Şifre sıfırlama kodunuz: ${code}\n\nBu kod 3 dakika geçerlidir. 3 dakika içinde uygulama içinde bu kodu girip şifrenizi yenilemeniz gerekir; aksi halde kod geçersiz olur.\n\nBu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.`;

    return sendWithSmtp({ to: email, subject, text });
}

/**
 * Uygulama içi yardım/destek mesajı.
 * Alıcı: SUPPORT_INBOX (varsayılan labanalysis.noreply@gmail.com).
 */
async function sendSupportEmail({ fromName, fromEmail, userId, message }) {
    const inbox = (
        process.env.SUPPORT_INBOX || 'labanalysis.noreply@gmail.com'
    ).trim();
    const subject = `[Destek] ${fromName || fromEmail || 'Kullanıcı'}`;
    const text = [
        'Uygulama destek talebi',
        '',
        `Kullanıcı: ${fromName || '—'}`,
        `E-posta: ${fromEmail || '—'}`,
        `User ID: ${userId || '—'}`,
        '',
        'Mesaj:',
        String(message || '').trim(),
    ].join('\n');

    const { host, user, pass } = getSmtpAuth();
    if (!host || !user || !pass) {
        if (process.env.NODE_ENV !== 'production') {
            console.log('[Mail] Support (SMTP yok, log):', {
                inbox,
                subject,
                text,
            });
            return { sent: true, smtpConfigured: false, logged: true };
        }
        return { sent: false, smtpConfigured: false };
    }

    return sendWithSmtp({
        to: inbox,
        subject,
        text,
        replyTo: fromEmail || undefined,
    });
}

module.exports = {
    sendPasswordResetEmail,
    sendPasswordResetCodeEmail,
    sendSupportEmail,
};

/**
 * E-posta gönderimi (şifre sıfırlama + destek).
 * Railway'de Gmail SMTP (465/587) sık connection timeout verir →
 * varsa Resend / Brevo HTTPS API tercih edilir, sonra SMTP denenir.
 */

function getSmtpAuth() {
    const host = (process.env.SMTP_HOST || '').trim();
    const user = (process.env.SMTP_USER || '').trim();
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
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        tls: { minVersion: 'TLSv1.2' },
    });
}

async function sendWithResend({ to, subject, text, replyTo }) {
    const key = (process.env.RESEND_API_KEY || '').trim();
    if (!key) return null;

    const from =
        (process.env.MAIL_FROM || '').trim() ||
        'LabAnalysis <onboarding@resend.dev>';

    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${key}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from,
                to: [to],
                subject,
                text,
                ...(replyTo ? { reply_to: replyTo } : {}),
            }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            console.error('[Mail] Resend error:', res.status, data);
            return {
                sent: false,
                provider: 'resend',
                error: data?.message || `Resend HTTP ${res.status}`,
            };
        }
        return { sent: true, provider: 'resend', id: data?.id };
    } catch (err) {
        console.error('[Mail] Resend exception:', err?.message || err);
        return {
            sent: false,
            provider: 'resend',
            error: err?.message || 'Resend failed',
        };
    }
}

async function sendWithBrevo({ to, subject, text, replyTo }) {
    const key = (
        process.env.BREVO_API_KEY ||
        process.env.SENDINBLUE_API_KEY ||
        ''
    ).trim();
    if (!key) return null;

    const fromEmail =
        (process.env.MAIL_FROM || process.env.SMTP_USER || '').trim() ||
        'noreply@labanalysis.app';
    const fromName = 'LabAnalysis';

    try {
        const res = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'api-key': key,
                'Content-Type': 'application/json',
                accept: 'application/json',
            },
            body: JSON.stringify({
                sender: { name: fromName, email: fromEmail },
                to: [{ email: to }],
                subject,
                textContent: text,
                ...(replyTo ? { replyTo: { email: replyTo } } : {}),
            }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            console.error('[Mail] Brevo error:', res.status, data);
            return {
                sent: false,
                provider: 'brevo',
                error: data?.message || `Brevo HTTP ${res.status}`,
            };
        }
        return { sent: true, provider: 'brevo', id: data?.messageId };
    } catch (err) {
        console.error('[Mail] Brevo exception:', err?.message || err);
        return {
            sent: false,
            provider: 'brevo',
            error: err?.message || 'Brevo failed',
        };
    }
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
        { port: 465, secure: true },
        { port: 587, secure: false },
    ];

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

/** HTTPS API (Resend/Brevo) → SMTP sırası */
async function sendMail(opts) {
    const viaResend = await sendWithResend(opts);
    if (viaResend?.sent) return viaResend;

    const viaBrevo = await sendWithBrevo(opts);
    if (viaBrevo?.sent) return viaBrevo;

    const smtp = await sendWithSmtp(opts);
    if (smtp.sent) return smtp;

    // HTTP denendi ama başarısız + SMTP de başarısız
    const httpErr = viaResend?.error || viaBrevo?.error;
    return {
        sent: false,
        smtpConfigured: Boolean(getSmtpAuth().pass) || Boolean(httpErr),
        error: smtp.error || httpErr || 'No mail provider succeeded',
    };
}

async function sendPasswordResetEmail(email, token) {
    const base = process.env.RESET_LINK_BASE || 'pdfai://reset-password';
    const resetLink = base.includes('?')
        ? `${base}&token=${token}`
        : `${base}?token=${token}`;
    const subject = 'Şifre sıfırlama linki';
    const text = `Şifrenizi sıfırlamak için aşağıdaki linke tıklayın:\n\n${resetLink}\n\nBu link 1 saat geçerlidir.\n\nBu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.`;

    return sendMail({ to: email, subject, text });
}

async function sendPasswordResetCodeEmail(email, code) {
    const subject = 'Şifre sıfırlama kodunuz';
    const text = `Şifre sıfırlama kodunuz: ${code}\n\nBu kod 3 dakika geçerlidir. 3 dakika içinde uygulama içinde bu kodu girip şifrenizi yenilemeniz gerekir; aksi halde kod geçersiz olur.\n\nBu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.`;

    return sendMail({ to: email, subject, text });
}

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
    const hasHttp =
        Boolean((process.env.RESEND_API_KEY || '').trim()) ||
        Boolean(
            (process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY || '').trim(),
        );

    if (!host && !user && !pass && !hasHttp) {
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

    return sendMail({
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

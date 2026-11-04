/**
 * E-posta gönderimi (şifre sıfırlama + destek).
 *
 * Railway → Gmail SMTP (465/587) Connection timeout veriyor.
 * Ücretsiz çözüm: Google Apps Script Web App (HTTPS) + Gmail MailApp.
 * Env: GOOGLE_SCRIPT_MAIL_URL  (+ opsiyonel GOOGLE_SCRIPT_MAIL_SECRET)
 *
 * Lokal: SMTP_* ile doğrudan Gmail çalışır.
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

/** Tamamen ücretsiz: Google Apps Script → Gmail */
async function sendWithGoogleScript({ to, subject, text, replyTo }) {
    const url = (process.env.GOOGLE_SCRIPT_MAIL_URL || '').trim();
    if (!url) return null;

    const secret = (process.env.GOOGLE_SCRIPT_MAIL_SECRET || '').trim();
    const payload = {
        to,
        subject,
        text,
        ...(replyTo ? { replyTo } : {}),
        ...(secret ? { secret } : {}),
    };

    try {
        // Apps Script Web App akışı:
        // 1) POST /exec (redirect:manual) → 302 Location (echo URL)
        // 2) GET Location → JSON cevap  ({"ok":true})
        // redirect:follow POST'u GET'e çevirip 405 verir; Location'a ikinci POST da 405.
        // Content-Type text/plain: JSON Content-Type bazen Script tarafında sorun çıkarır.
        const body = JSON.stringify(payload);
        const headers = { 'Content-Type': 'text/plain;charset=utf-8' };

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 25000);
        let res;
        try {
            res = await fetch(url, {
                method: 'POST',
                redirect: 'manual',
                headers,
                body,
                signal: controller.signal,
            });

            if (res.status >= 300 && res.status < 400) {
                const loc = res.headers.get('location');
                if (!loc) {
                    return {
                        sent: false,
                        provider: 'google-script',
                        error: `Google Script redirect without Location (${res.status})`,
                    };
                }
                res = await fetch(loc, {
                    method: 'GET',
                    redirect: 'follow',
                    signal: controller.signal,
                });
            }
        } finally {
            clearTimeout(timer);
        }

        const raw = await res.text();
        let data = {};
        try {
            data = JSON.parse(raw);
        } catch {
            data = { raw: String(raw).slice(0, 300) };
        }

        if (!res.ok || data.ok === false) {
            console.error('[Mail] Google Script error:', res.status, data);
            return {
                sent: false,
                provider: 'google-script',
                error:
                    data?.error ||
                    data?.raw ||
                    `Google Script HTTP ${res.status}`,
            };
        }
        return { sent: true, provider: 'google-script' };
    } catch (err) {
        console.error('[Mail] Google Script exception:', err?.message || err);
        return {
            sent: false,
            provider: 'google-script',
            error: err?.message || 'Google Script failed',
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

/** Önce Google Script (ücretsiz HTTPS), sonra SMTP */
async function sendMail(opts) {
    const viaScript = await sendWithGoogleScript(opts);
    if (viaScript?.sent) return viaScript;

    const smtp = await sendWithSmtp(opts);
    if (smtp.sent) return smtp;

    return {
        sent: false,
        smtpConfigured:
            Boolean(getSmtpAuth().pass) ||
            Boolean((process.env.GOOGLE_SCRIPT_MAIL_URL || '').trim()),
        error:
            viaScript?.error ||
            smtp.error ||
            'No mail provider succeeded',
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
    const hasScript = Boolean(
        (process.env.GOOGLE_SCRIPT_MAIL_URL || '').trim(),
    );

    if (!hasScript && !host && !user && !pass) {
        if (process.env.NODE_ENV !== 'production') {
            console.log('[Mail] Support (provider yok, log):', {
                inbox,
                subject,
                text,
            });
            return { sent: true, smtpConfigured: false, logged: true };
        }
        return {
            sent: false,
            smtpConfigured: false,
            error: 'GOOGLE_SCRIPT_MAIL_URL or SMTP not configured',
        };
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

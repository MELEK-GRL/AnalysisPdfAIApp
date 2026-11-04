/**
 * E-posta gönderimi (şifre sıfırlama + destek).
 *
 * Railway → Gmail SMTP (465/587) Connection timeout veriyor.
 * Ücretsiz çözüm: Google Apps Script Web App (HTTPS) + Gmail MailApp.
 * Env: GOOGLE_SCRIPT_MAIL_URL  (+ opsiyonel GOOGLE_SCRIPT_MAIL_SECRET)
 *
 * Lokal: SMTP_* ile doğrudan Gmail çalışır (Script yoksa).
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

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

function normalizeScriptUrl(raw) {
    return String(raw || '')
        .trim()
        .replace(/^['"]|['"]$/g, '');
}

/**
 * Node fetch (undici) Apps Script 302'sinde Location'a yeniden POST atıp 405 üretebiliyor.
 * https.request redirect takip etmez → POST /exec, sonra GET Location.
 */
function httpOnce(targetUrl, { method = 'GET', headers = {}, body, timeoutMs = 20000 } = {}) {
    return new Promise((resolve, reject) => {
        let parsed;
        try {
            parsed = new URL(targetUrl);
        } catch (err) {
            reject(new Error(`Invalid URL: ${targetUrl}`));
            return;
        }

        const lib = parsed.protocol === 'http:' ? http : https;
        const payload = body == null ? null : Buffer.from(String(body), 'utf8');
        const reqHeaders = { ...headers };
        if (payload && !reqHeaders['Content-Length']) {
            reqHeaders['Content-Length'] = String(payload.length);
        }

        const req = lib.request(
            {
                protocol: parsed.protocol,
                hostname: parsed.hostname,
                port: parsed.port || (parsed.protocol === 'http:' ? 80 : 443),
                path: `${parsed.pathname}${parsed.search}`,
                method,
                headers: reqHeaders,
                timeout: timeoutMs,
            },
            (res) => {
                const chunks = [];
                res.on('data', (c) => chunks.push(c));
                res.on('end', () => {
                    resolve({
                        status: res.statusCode || 0,
                        headers: res.headers,
                        body: Buffer.concat(chunks).toString('utf8'),
                    });
                });
            },
        );

        req.on('timeout', () => {
            req.destroy(new Error(`Request timeout after ${timeoutMs}ms`));
        });
        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });
}

function parseJsonSafe(raw) {
    try {
        return JSON.parse(raw);
    } catch {
        return { raw: String(raw || '').slice(0, 300) };
    }
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/** Destek maili — marka moru (#736EF7 / #7453E0) */
function buildSupportEmailHtml({ fromName, fromEmail, userId, message }) {
    const name = escapeHtml(fromName || '—');
    const email = escapeHtml(fromEmail || '—');
    const uid = escapeHtml(userId || '—');
    const msg = escapeHtml(String(message || '').trim()).replace(/\n/g, '<br/>');
    const when = escapeHtml(
        new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }),
    );

    return `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#F3F1FF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F3F1FF;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 28px rgba(116,83,224,0.12);">
        <tr>
          <td style="background:linear-gradient(135deg,#7453E0 0%,#736EF7 100%);padding:28px 28px 22px;">
            <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.78);font-weight:600;">Lab Analysis</div>
            <div style="margin-top:8px;font-size:22px;line-height:1.3;color:#ffffff;font-weight:700;">Yeni destek talebi</div>
            <div style="margin-top:6px;font-size:13px;color:rgba(255,255,255,0.85);">${when}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 28px 8px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F8F7FF;border:1px solid #E8E4FF;border-radius:12px;">
              <tr>
                <td style="padding:14px 16px;border-bottom:1px solid #E8E4FF;">
                  <div style="font-size:11px;color:#8B86C8;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;">Kullanıcı</div>
                  <div style="margin-top:4px;font-size:15px;color:#1F1B3D;font-weight:600;">${name}</div>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 16px;border-bottom:1px solid #E8E4FF;">
                  <div style="font-size:11px;color:#8B86C8;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;">E-posta</div>
                  <div style="margin-top:4px;font-size:15px;color:#1F1B3D;">
                    <a href="mailto:${email}" style="color:#5E55DB;text-decoration:none;font-weight:600;">${email}</a>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 16px;">
                  <div style="font-size:11px;color:#8B86C8;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;">User ID</div>
                  <div style="margin-top:4px;font-size:13px;color:#6E6E73;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;">${uid}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 28px 28px;">
            <div style="font-size:11px;color:#8B86C8;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;margin-bottom:10px;">Mesaj</div>
            <div style="background:#ffffff;border:1px solid #E8E4FF;border-left:4px solid #736EF7;border-radius:10px;padding:16px 18px;font-size:15px;line-height:1.55;color:#1F1B3D;">${msg}</div>
            <div style="margin-top:18px;font-size:12px;color:#9B97B8;line-height:1.45;">Yanıtlamak için bu mailde <strong style="color:#736EF7;">Yanıtla</strong> kullanın; yanıt doğrudan kullanıcının e-postasına gider.</div>
          </td>
        </tr>
      </table>
      <div style="max-width:560px;margin-top:14px;font-size:11px;color:#A39FBF;text-align:center;">Bu mesaj uygulama içi Yardım ve destek formundan iletildi.</div>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Tamamen ücretsiz: Google Apps Script → Gmail */
async function sendWithGoogleScript({ to, subject, text, html, replyTo }) {
    const url = normalizeScriptUrl(process.env.GOOGLE_SCRIPT_MAIL_URL);
    if (!url) return null;

    const secret = (process.env.GOOGLE_SCRIPT_MAIL_SECRET || '').trim();
    const payload = {
        to,
        subject,
        text,
        ...(html ? { html } : {}),
        ...(replyTo ? { replyTo } : {}),
        ...(secret ? { secret } : {}),
    };

    try {
        const body = JSON.stringify(payload);
        const headers = {
            'Content-Type': 'text/plain;charset=utf-8',
            Accept: 'application/json,text/plain,*/*',
        };

        let res = await httpOnce(url, {
            method: 'POST',
            headers,
            body,
            timeoutMs: 25000,
        });

        // Apps Script: 302 + Location (echo) → GET ile JSON
        if (res.status >= 300 && res.status < 400) {
            const loc = res.headers.location || res.headers.Location;
            if (!loc) {
                console.error('[Mail] Google Script redirect without Location', res.status);
                return {
                    sent: false,
                    provider: 'google-script',
                    error: `Google Script redirect without Location (${res.status})`,
                };
            }
            const absolute = new URL(loc, url).toString();
            res = await httpOnce(absolute, {
                method: 'GET',
                timeoutMs: 25000,
            });
        }

        const data = parseJsonSafe(res.body);
        const okFlag = data && data.ok === true;
        const httpOk = res.status >= 200 && res.status < 300;

        if (!okFlag && (!httpOk || data.ok === false)) {
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

        console.log('[Mail] Google Script ok');
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

async function sendWithSmtp({ to, subject, text, html, replyTo }) {
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
                ...(html ? { html } : {}),
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
 * Script URL varsa sadece onu kullan (Railway SMTP timeout client'ı 30sn'de düşürüyordu).
 * Script yoksa lokal SMTP.
 */
async function sendMail(opts) {
    const hasScript = Boolean(normalizeScriptUrl(process.env.GOOGLE_SCRIPT_MAIL_URL));

    if (hasScript) {
        const viaScript = await sendWithGoogleScript(opts);
        if (viaScript?.sent) return viaScript;
        return {
            sent: false,
            smtpConfigured: true,
            error: viaScript?.error || 'Google Script mail failed',
        };
    }

    const smtp = await sendWithSmtp(opts);
    if (smtp.sent) return smtp;

    return {
        sent: false,
        smtpConfigured: Boolean(getSmtpAuth().pass),
        error: smtp.error || 'No mail provider succeeded',
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
        'Lab Analysis — Yeni destek talebi',
        '',
        `Kullanıcı: ${fromName || '—'}`,
        `E-posta: ${fromEmail || '—'}`,
        `User ID: ${userId || '—'}`,
        '',
        'Mesaj:',
        String(message || '').trim(),
        '',
        '—',
        'Yanıtlamak için bu mailde Yanıtla kullanın.',
    ].join('\n');
    const html = buildSupportEmailHtml({
        fromName,
        fromEmail,
        userId,
        message,
    });

    const { host, user, pass } = getSmtpAuth();
    const hasScript = Boolean(normalizeScriptUrl(process.env.GOOGLE_SCRIPT_MAIL_URL));

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
        html,
        replyTo: fromEmail || undefined,
    });
}

module.exports = {
    sendPasswordResetEmail,
    sendPasswordResetCodeEmail,
    sendSupportEmail,
};

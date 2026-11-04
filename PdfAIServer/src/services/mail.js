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

/**
 * Destek maili HTML — uygulama renkleri (#7453E0, #736EF7, #e6ecff).
 * Gmail uyumu için solid renk + table layout (gradient çoğu istemcide düşer).
 */
function buildSupportEmailHtml({ fromName, fromEmail, userId, message }) {
    const name = escapeHtml(fromName || '—');
    const email = escapeHtml(fromEmail || '—');
    const uid = escapeHtml(userId || '—');
    const msg = escapeHtml(String(message || '').trim()).replace(/\n/g, '<br/>');
    const when = escapeHtml(
        new Date().toLocaleString('tr-TR', {
            timeZone: 'Europe/Istanbul',
            dateStyle: 'long',
            timeStyle: 'short',
        }),
    );

    return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Destek talebi</title>
</head>
<body style="margin:0;padding:0;background-color:#e6ecff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#e6ecff" style="background-color:#e6ecff;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;">
        <tr>
          <td align="center" style="padding:0 0 14px;">
            <span style="display:inline-block;background-color:#ECEBFD;color:#4941B3;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:6px 12px;border-radius:999px;">Yardım &amp; destek</span>
          </td>
        </tr>
        <tr>
          <td bgcolor="#ffffff" style="background-color:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #d8d4f5;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td bgcolor="#7453E0" style="background-color:#7453E0;padding:26px 28px;">
                  <div style="font-size:13px;font-weight:600;color:#D8D2FF;letter-spacing:0.04em;">Lab Analysis</div>
                  <div style="margin-top:8px;font-size:24px;line-height:1.25;font-weight:700;color:#ffffff;">Yeni destek talebi geldi</div>
                  <div style="margin-top:10px;font-size:13px;line-height:1.45;color:#E8E4FF;">Uygulamadaki formdan iletildi. Kullanıcıya dönüş için bu mailde <strong style="color:#ffffff;">Yanıtla</strong> kullanın.</div>
                </td>
              </tr>
              <tr>
                <td style="padding:22px 28px 6px;">
                  <div style="font-size:12px;font-weight:700;color:#736EF7;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:10px;">Gönderen bilgileri</div>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#f9fafd" style="background-color:#f9fafd;border:1px solid #E4E0FA;border-radius:12px;">
                    <tr>
                      <td style="padding:14px 16px;border-bottom:1px solid #E4E0FA;width:34%;vertical-align:top;">
                        <div style="font-size:11px;color:#8B86C8;font-weight:600;">Kullanıcı adı</div>
                      </td>
                      <td style="padding:14px 16px;border-bottom:1px solid #E4E0FA;vertical-align:top;">
                        <div style="font-size:15px;color:#1D1D1F;font-weight:700;">${name}</div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:14px 16px;border-bottom:1px solid #E4E0FA;width:34%;vertical-align:top;">
                        <div style="font-size:11px;color:#8B86C8;font-weight:600;">E-posta</div>
                      </td>
                      <td style="padding:14px 16px;border-bottom:1px solid #E4E0FA;vertical-align:top;">
                        <a href="mailto:${email}" style="font-size:15px;color:#3B49F7;font-weight:700;text-decoration:none;">${email}</a>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:14px 16px;width:34%;vertical-align:top;">
                        <div style="font-size:11px;color:#8B86C8;font-weight:600;">User ID</div>
                      </td>
                      <td style="padding:14px 16px;vertical-align:top;">
                        <div style="font-size:12px;color:#6E6E73;font-family:Menlo,Consolas,monospace;word-break:break-all;">${uid}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:18px 28px 8px;">
                  <div style="font-size:12px;font-weight:700;color:#736EF7;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:10px;">Kullanıcı mesajı</div>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td bgcolor="#ECEBFD" width="5" style="background-color:#736EF7;width:5px;border-radius:4px 0 0 4px;"></td>
                      <td bgcolor="#F8F7FF" style="background-color:#F8F7FF;border:1px solid #E4E0FA;border-left:none;border-radius:0 12px 12px 0;padding:16px 18px;font-size:15px;line-height:1.6;color:#1D1D1F;">${msg}</td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 28px 26px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#efe9ff" style="background-color:#efe9ff;border-radius:12px;border:1px solid #D8D2FF;">
                    <tr>
                      <td style="padding:14px 16px;">
                        <div style="font-size:13px;font-weight:700;color:#4941B3;margin-bottom:4px;">Nasıl yanıtlanır?</div>
                        <div style="font-size:13px;line-height:1.5;color:#4B5563;">Gmail’de <strong style="color:#7453E0;">Yanıtla</strong>’ya basın. Reply-To kullanıcının e-postasıdır; cevap doğrudan <strong>${email}</strong> adresine gider.</div>
                        <div style="margin-top:8px;font-size:12px;color:#8B86C8;">Talep zamanı: ${when}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:16px 8px 0;font-size:11px;line-height:1.5;color:#8B86C8;">
            Bu e-posta Lab Analysis uygulamasındaki <em>Yardım ve destek</em> ekranından otomatik gönderildi.<br/>
            Destek adresi uygulamada gösterilmez.
          </td>
        </tr>
      </table>
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

/**
 * Şifre sıfırlama kodu HTML — destek mailiyle aynı marka dili.
 */
function buildPasswordResetEmailHtml(code) {
    const safeCode = escapeHtml(String(code || '').trim());
    const when = escapeHtml(
        new Date().toLocaleString('tr-TR', {
            timeZone: 'Europe/Istanbul',
            dateStyle: 'long',
            timeStyle: 'short',
        }),
    );

    return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Şifre sıfırlama kodu</title>
</head>
<body style="margin:0;padding:0;background-color:#e6ecff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#e6ecff" style="background-color:#e6ecff;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;">
        <tr>
          <td align="center" style="padding:0 0 14px;">
            <span style="display:inline-block;background-color:#ECEBFD;color:#4941B3;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:6px 12px;border-radius:999px;">Şifre sıfırlama</span>
          </td>
        </tr>
        <tr>
          <td bgcolor="#ffffff" style="background-color:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #d8d4f5;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td bgcolor="#7453E0" style="background-color:#7453E0;padding:26px 28px;">
                  <div style="font-size:13px;font-weight:600;color:#D8D2FF;letter-spacing:0.04em;">Lab Analysis</div>
                  <div style="margin-top:8px;font-size:24px;line-height:1.25;font-weight:700;color:#ffffff;">Şifre sıfırlama kodunuz</div>
                  <div style="margin-top:10px;font-size:13px;line-height:1.45;color:#E8E4FF;">Uygulamada bu kodu girerek yeni şifrenizi belirleyebilirsiniz.</div>
                </td>
              </tr>
              <tr>
                <td style="padding:28px 28px 10px;" align="center">
                  <div style="font-size:12px;font-weight:700;color:#736EF7;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:12px;">6 haneli kod</div>
                  <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto;">
                    <tr>
                      <td bgcolor="#F8F7FF" style="background-color:#F8F7FF;border:2px solid #D8D2FF;border-radius:14px;padding:18px 28px;">
                        <div style="font-size:36px;line-height:1;font-weight:800;letter-spacing:0.28em;color:#7453E0;font-family:Menlo,Consolas,monospace;">${safeCode}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:18px 28px 26px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#efe9ff" style="background-color:#efe9ff;border-radius:12px;border:1px solid #D8D2FF;">
                    <tr>
                      <td style="padding:14px 16px;">
                        <div style="font-size:13px;font-weight:700;color:#4941B3;margin-bottom:4px;">Önemli</div>
                        <div style="font-size:13px;line-height:1.5;color:#4B5563;">Bu kod <strong style="color:#7453E0;">3 dakika</strong> geçerlidir. Süre dolmadan uygulamada kodu girip şifrenizi yenilemeniz gerekir.</div>
                        <div style="margin-top:8px;font-size:13px;line-height:1.5;color:#4B5563;">Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.</div>
                        <div style="margin-top:8px;font-size:12px;color:#8B86C8;">Gönderim: ${when}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:16px 8px 0;font-size:11px;line-height:1.5;color:#8B86C8;">
            Bu e-posta Lab Analysis uygulamasındaki <em>Şifremi unuttum</em> akışından otomatik gönderildi.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendPasswordResetCodeEmail(email, code) {
    const subject = 'Şifre sıfırlama kodunuz';
    const text = `Şifre sıfırlama kodunuz: ${code}\n\nBu kod 3 dakika geçerlidir. 3 dakika içinde uygulama içinde bu kodu girip şifrenizi yenilemeniz gerekir; aksi halde kod geçersiz olur.\n\nBu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.`;
    const html = buildPasswordResetEmailHtml(code);

    return sendMail({ to: email, subject, text, html });
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
    sendPasswordResetCodeEmail,
    sendSupportEmail,
};

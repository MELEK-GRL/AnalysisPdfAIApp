/**
 * TAMAMEN ÜCRETSİZ mail köprüsü (Google Apps Script + Gmail).
 *
 * Kurulum:
 * 1) https://script.google.com → Yeni proje
 * 2) Bu dosyanın içeriğini Code.gs'e yapıştır
 * 3) Deploy → New deployment → Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4) Deploy → Web app URL'ini kopyala
 * 5) Railway Variables:
 *    GOOGLE_SCRIPT_MAIL_URL=<web app url>
 *    SUPPORT_INBOX=labanalysis.noreply@gmail.com
 * 6) Redeploy
 *
 * Not: Script'i labanalysis.noreply@gmail.com hesabıyla oluşturursan
 * mailler o Gmail'den / o gelen kutusuna gider (günlük Gmail kotası içinde, ücret yok).
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');
    // Opsiyonel: Railway'de GOOGLE_SCRIPT_MAIL_SECRET ile aynı değeri koy
    var expected = PropertiesService.getScriptProperties().getProperty('MAIL_SECRET');
    if (expected && data.secret !== expected) {
      return json_({ ok: false, error: 'unauthorized' });
    }

    const to = String(data.to || '').trim();
    const subject = String(data.subject || 'Destek').trim();
    const body = String(data.text || data.body || '').trim();
    const replyTo = String(data.replyTo || '').trim();

    if (!to || !body) {
      return json_({ ok: false, error: 'to and text required' });
    }

    const opts = { to: to, subject: subject, body: body };
    if (replyTo) opts.replyTo = replyTo;

    MailApp.sendEmail(opts);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doGet() {
  return json_({ ok: true, service: 'labanalysis-mail-bridge' });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

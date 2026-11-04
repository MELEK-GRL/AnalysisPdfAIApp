/**
 * TAMAMEN ÜCRETSİZ mail köprüsü (Google Apps Script + Gmail).
 *
 * ÖNEMLİ — HTML mail görünmesi için bu dosyayı Google'da güncelle:
 * 1) https://script.google.com → mail köprüsü projeni aç
 * 2) Code.gs içeriğini BU dosyanın tamamıyla değiştir (htmlBody satırları şart)
 * 3) Deploy → Manage deployments → kalem (Edit) → Version: New version → Deploy
 * 4) URL değişirse Railway GOOGLE_SCRIPT_MAIL_URL'i güncelle
 *
 * htmlBody yoksa Gmail sadece düz metin gösterir (renkli tasarım gelmez).
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
    const html = String(data.html || '').trim();
    const replyTo = String(data.replyTo || '').trim();

    if (!to || !body) {
      return json_({ ok: false, error: 'to and text required' });
    }

    const opts = { to: to, subject: subject, body: body };
    if (html) opts.htmlBody = html;
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

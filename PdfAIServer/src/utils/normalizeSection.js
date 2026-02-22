/**
 * KURAL: PDF’den okunan her şey değişkendir – parametre adları, bölüm başlıkları, test listesi
 * sabit değildir. Her gelen PDF farklı lab/hastane/ülke formatında olabilir; sabit parametre
 * veya bölüm listesi kullanılmaz, sadece PDF metninden çıkarılanlar kullanılır.
 *
 * Bölüm başlığının "junk" (test+değer+birim birleşmiş satır) olup olmadığını kontrol eder.
 * Örnek: "Açlık Kan Şekeri (AKŞ)86mg/dL70 - 100" -> junk (içinde sayı+birim var).
 */
function isJunkSection(title) {
    if (!title || typeof title !== 'string') return false;
    const t = title.trim();
    if (t.length < 15) return false;
    // Tahlil satırı gibi: sayı + birim (mg/dL, U/L, mmol, %, fl, sn, K/uL vb.) içeriyorsa junk
    if (/\d+[,.]?\d*\s*(mg\/dL|mmol\/L|U\/L|IU\/L|g\/L|%|fl|sn|K\/uL|M\/uL|mg\/L)/i.test(t)) return true;
    // "Kan Grubu ve Rh (JELLİ SİSTEM)0 RH(+)" gibi test + kategorik değer birleşmiş
    if (/\d+\s*RH\s*[\(\s]*\+/i.test(t)) return true;
    return false;
}

/** Tablo sütun adı / kurum adı / metadata – bunlar PDF’deki gerçek bölüm başlığı değil, bölüm olarak kullanılmamalı. */
function isSectionHeaderBlocklist(title) {
    if (!title || typeof title !== 'string') return false;
    const t = title.trim();
    const blocklist = [
        /^Değeri$/i, /^Sonuç$/i, /^Referans$/i, /^Birimi$/i, /^Tarih$/i, /^Analiz$/i,
        /^TarihTahlilSonuç$/i, /^Sonuç\s+Birim/i, /^Referans\s+Değeri/i,
        /^POZİTİF$/i, /^Negatif$/i, /^Reaktif$/i,
        /Sağlık Bilgi Sistemleri/i, /Genel Müdürlüğü/i, /BAKANLIĞI/i, /^T\.C\./i,
        /enabiz|Sayfa\s*\d|Adı\/Soyadı|Cinsiyet|Doğum\s*Tarihi|Sağlık Tesisi|Hastanesi/i,
        /* Tablo sütunu / birleşik satır (idrar vb.): BIRIM REFERANS, Görünüm/Renk+değer birleşik */
        /BIRIM\s*REFERANS|BIRIMREFERANS/i,
        /^GÖRÜNÜM[A-Za-zığüşöçİ]/i,
        /^RENK[A-Za-zığüşöçİ]/i,
        /SONUC\s*BIRIM|ACIL\s*SONUC\s*BIRIM/i,
        /* Test adı + değer birleşik (örn. LIPAZ(ACİL)45.7BIRIM, BETA-HCG (ACIL)<0.200) */
        /\d+[,.]?\d*\s*BIRIM\s*\d|<\s*0[,.]\d+.*IU\/mL/i,
    ];
    return blocklist.some((rx) => rx.test(t));
}

/**
 * Junk başlıktan okunabilir kısmı çıkarır: sayı+birim öncesi metni alır (en fazla ~50 karakter).
 */
function stripJunkToPrefix(title) {
    const t = title.trim();
    let match = t.match(/^(.+?)\d+[,.]?\d*\s*(mg\/dL|mmol\/L|U\/L|IU\/L|g\/L|%|fl|sn|K\/uL|M\/uL|mg\/L)/i);
    if (!match) match = t.match(/^(.+?)\d+\s*RH\s*[\(\s]*\+/i);
    const prefix = match ? match[1].trim() : t;
    if (prefix.length >= 2 && prefix.length <= 55) return prefix;
    return null;
}

/**
 * Sadece açıkça hatalı (junk) bölüm başlıklarını düzeltir; diğer tüm başlıklar PDF'teki gibi aynen kalır.
 * Böylece farklı lab/hastane/ülke PDF'leri kendi bölüm adlarıyla gösterilir (sabit liste yok).
 * @param {string|null|undefined} title
 * @returns {string|null|undefined}
 */
function normalizeSectionTitle(title) {
    if (title == null || typeof title !== 'string') return title;
    const t = title.trim();
    if (!t) return title;

    // Birleşik/junk satırlar: sabit bölüm adı atanmaz; PDF’teki gerçek başlık kullanılır veya null.
    if (/İDRAR.*OTOMATIK\s*IDRAR|OTOMATIK\s*IDRAR\s*BIYOKIMYASI/i.test(t) && t.length > 30) return null;
    if (/Maya\s*\(Mantar\)\s*\d.*HPF\s*0\s*-\s*2/.test(t) && t.length < 35) return null;

    // Junk: test adı + değer + birim birleşmiş (örn. "Açlık Kan Şekeri (AKŞ)86mg/dL70 - 100")
    if (isJunkSection(t)) {
        const prefix = stripJunkToPrefix(t);
        if (prefix) return prefix;
        return 'Laboratuvar';
    }

    // Sabit bölüm adı yok – her PDF kendi başlığını getirir (BİYOKİMYA, Hemogram, vs.); aynen döndür.
    return t;
}

function normalizeItemsSections(items) {
    if (!Array.isArray(items) || items.length === 0) return items;
    return items.map((it) => ({
        ...it,
        section: it && it.section != null ? normalizeSectionTitle(it.section) : it.section,
    }));
}

module.exports = { normalizeSectionTitle, normalizeItemsSections, isJunkSection, isSectionHeaderBlocklist };

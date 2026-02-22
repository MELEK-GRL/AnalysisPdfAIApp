# Tahlil PDF Tabloları – Çıkarılacak ve Gösterilecek Alanlar

Bu doküman, farklı tahlil PDF’lerinden **doğru alan çıkarma** ve **uygulama arayüzünde doğru gösterme** için dikkat edilecek kuralları toplar.

---

## Tablolarda Olması Gereken Sütunlar

| Sütun (PDF)        | API / Veri alanı | UI’da gösterim |
|--------------------|------------------|----------------|
| **Tahlil**         | `test`           | Test adı (kart başlığı) |
| **Sonuç**          | `value` veya `valueDisplay` veya `resultLabel` | Değer alanı (sayı veya metin) |
| **Sonuç Birimi**   | `unit`          | Birim (mg/dL, IU/L, %, HPF, BIRIM vb.) |
| **Referans Değeri**| `refLow`, `refHigh` (veya metin) | “Olması gereken aralık: X – Y” |

---

## Dikkat Edilecek Noktalar

### 1. Tahlil adı (test)
- **Tam ve okunabilir** olmalı: “ALT - ALANIN AMINOTRANSFERAZ (ACIL)”, “HR HPV Tip (33 / 58)”, “Non-Skuamoz Epitel (Yassı olmayan Epitel)”.
- Başlık / sütun metni **test adına karışmamalı**: “BIRIMREFERANS”, “NegatifBIRIM” gibi ifadeler test adından temizlenmeli.
- Grup başlıkları (“HUMAN PAPILLOMA VIRUS HPV”, “Tam Kan Sayımı (Hemogram)”) ayrı tutulabilir; asıl satırlar **tek tek test** olarak çıkarılmalı.

### 2. Sonuç (value / valueDisplay / resultLabel)
- **Sayısal:** 23, 1,05, 36.5, 0.02 → `value` (number), birim `unit` ile.
- **Metin / kategorik:** “Negatif”, “Pozitif”, “Manuel Çalışılmıştır” → `resultLabel` veya uygun durumda `valueDisplay`.
- **Sınır ifadeleri:** “<0.200”, “<0,5” → `valueDisplay` ile aynen gösterilmeli; sayısal eşiği `value` ile saklayabiliriz.
- **Referans yoksa:** Sadece sonuç metni gösterilir (kategorik kart).

### 3. Sonuç birimi (unit)
- **Gerçek birimler:** mg/dL, mmol/L, IU/L, %, HPF, fL, ng/dL, µIU/ml, x10^3/uL, x10^6/uL, K/uL, M/uL, sn, g/L, mg/L vb. → `unit` alanında doğru yazılmalı.
- **Placeholder:** “BIRIM”, “REFERANS” gibi genel ifadeler birim/referans olarak **anlamlı değilse** null/boş veya “—” gösterilebilir; test adı ve sonuç öne çıkarılmalı.

### 4. Referans değeri (refLow, refHigh)
- **Aralık:** “0 - 33”, “0,70 - 1,48”, “37 - 47” → `refLow`, `refHigh` sayısal parse edilmeli; UI’da “Olması gereken aralık: X – Y” formatında.
- **Karmaşık referans:** BETA-HCG gibi “Gebelik dışı 0–5”, haftalara göre aralıklar vb. → Mümkünse en azından ana aralık (örn. 0–5) parse edilmeli; tam metin ileride ayrı alanla saklanabilir.
- **Placeholder “REFERANS”:** Sayısal aralık yoksa `refLow`/`refHigh` null; UI’da referans satırı gizlenir veya “—” gösterilir.

### 5. Görsel durum (Normal / Düşük / Yüksek)
- **Sonuç referans içindeyse:** Yeşil çubuk, “Normal” (veya Negatif/Pozitif’e göre yeşil/kırmızı).
- **Sonuç referansın altında/üstündeyse:** Sarı/kırmızı çubuk, “Düşük” / “Yüksek”.
- **Sadece kategorik sonuç (Negatif/Pozitif):** Referans yok; çubuk rengi sonuca göre (Negatif = yeşil, Pozitif = kırmızı), sayısal “kalp” konumu gösterilmez.

### 6. Özel durumlar
- **HPV / tarama testleri:** Sonuç “Negatif”/“Pozitif”; birim “BIRIM”, referans “REFERANS” ise bunlar placeholder kabul edilip UI’da sadece test adı + “Negatif”/“Pozitif” vurgulanmalı.
- **Metin sonuçlar:** “Manuel Çalışılmıştır” gibi ifadeler `valueDisplay` veya `resultLabel` ile gösterilmeli; sayısal çubuk kullanılmaz.
- **Ondalık ayırıcı:** PDF’de virgül (1,05) veya nokta (1.05) kullanılabilir; parse ve UI’da tutarlı format (nokta veya yerel virgül) kullanılmalı.

---

## Uygulama Tarafında Kontrol Listesi

- [ ] Her kartta **tahlil adı** net ve birleşik başlık metninden arındırılmış.
- [ ] **Sonuç** sayı, “<0.5” gibi ifade veya “Negatif”/“Pozitif” olarak doğru alanda gösteriliyor.
- [ ] **Birim** doğru (mg/dL, IU/L, %, HPF vb.); “BIRIM” placeholder ise anlamlı şekilde ele alınıyor.
- [ ] **Referans aralığı** sayısal ise “X – Y” formatında; yoksa veya placeholder ise referans satırı/çubuk buna göre.
- [ ] Normal / düşük / yüksek renk ve etiketleri `refLow`/`refHigh` ve `resultLabel` ile uyumlu.

Bu kurallara göre çıkarma ve UI davranışı test edilecek; yeni PDF’lerle tekrar deneyeceğiz.

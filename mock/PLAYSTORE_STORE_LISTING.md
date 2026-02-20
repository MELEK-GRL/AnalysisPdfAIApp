# Play Store – Store Listesi (Sprint 12.2)

Play Console’da **Store ayarları > Store listesi** bölümüne gireceğiniz metinler ve görsel gereksinimleri. Tıbbi iddia içermeyin; "bilgilendirme amaçlı", "tıbbi tavsiye yerine geçmez" vurgusu zorunludur.

---

## 1. Uygulama adı (mağazada görünen)

- **Öneri:** "Tahlil Analizi" veya "PDF Tahlil Analizi" (kullanıcı dostu)
- Şu an proje adı: **PdfAICli** (`android/app/src/main/res/values/strings.xml` → `app_name`)
- Mağazada farklı bir isim kullanacaksanız önce `strings.xml` içindeki `app_name` ile uyumlu yapın veya store’da aynı ismi yazın.

---

## 2. Kısa açıklama (max 80 karakter)

Play Store’da uygulama kartında görünür. Tıbbi tanı/teşhis iddiası olmasın.

### Türkçe (örnek)
```
Tahlil PDF'lerinizi yükleyin; yapay zekâ değerleri çıkarıp anlaşılır dille yorumlasın. Bilgilendirme amaçlıdır.
```
*(Karakter sayısını kontrol edin; 80’i geçmeyin.)*

### İngilizce (örnek)
```
Upload lab PDFs; AI extracts values and explains in plain language. For informational use only.
```

---

## 3. Uzun açıklama (max 4000 karakter)

Uygulamanın ne yaptığını, kime hitap ettiğini ve **tıbbi tavsiye yerine geçmediğini** net yazın.

### Türkçe şablon

```
PDF Tahlil Analizi uygulaması, laboratuvar ve tahlil raporlarınızı PDF olarak yüklemenize ve bu raporlardaki değerlerin yapay zekâ ile anlaşılır bir dille yorumlanmasına olanak tanır.

NE YAPAR?
• Tahlil raporu PDF’lerinizi yüklemenizi sağlar
• Rapordaki parametreleri ve değerleri otomatik çıkarır
• Yapay zekâ ile size özet ve anlaşılır bir yorum sunar
• Analiz geçmişinizi saklayıp daha sonra tekrar inceleyebilirsiniz

KİME HİTAP EDER?
• Tahlil sonuçlarını daha iyi anlamak isteyen kullanıcılar
• Sonuçları doktoruna götürmeden önce genel bir fikir edinmek isteyenler

ÖNEMLİ UYARI
Bu uygulama yalnızca bilgilendirme ve genel farkındalık amacıyla hazırlanmıştır. Tıbbi tanı, teşhis veya tedavi hizmeti sunmaz. Kesin yorum ve tedavi planı için mutlaka doktorunuza danışın. Uygulama içindeki analizler tıbbi tavsiye yerine geçmez.

Gizlilik politikamızda toplanan veriler, sağlık verisi işleme ve üçüncü taraf (OpenAI) aktarımı açıklanmaktadır. Uygulamayı kullanarak bu koşulları kabul etmiş sayılırsınız.
```

### İngilizce şablon

```
PDF Lab Analysis app lets you upload your lab and test report PDFs and get the values interpreted in plain language using AI.

WHAT IT DOES
• Upload your lab report PDFs
• Automatically extracts parameters and values from the report
• Provides a clear, AI-generated summary and interpretation
• Saves your analysis history for later review

WHO IS IT FOR?
• Users who want to better understand their lab results
• Anyone who wants a general overview before discussing results with a doctor

IMPORTANT DISCLAIMER
This app is for information and general awareness only. It does not provide medical diagnosis, treatment or advice. Always consult your doctor for interpretation and treatment. The analyses in this app are not a substitute for medical advice.

Our privacy policy explains data collection, health data processing and third-party (OpenAI) sharing. By using the app you accept these terms.
```

---

## 4. Görsel gereksinimleri (Play Console’da yüklenecek)

| Görsel | Boyut | Not |
|--------|--------|-----|
| **Uygulama ikonu** | 512 x 512 px | PNG, 32-bit; şeffaf arka plan yok (opak olmalı) |
| **Feature graphic** | 1024 x 500 px | Banner; mağaza sayfasında üstte görünür |
| **Ekran görüntüleri** | En az 2 adet | Farklı cihaz boyutları önerilir (telefon, 7" tablet vb.) |

- Ekran görüntüleri: Uygulama açılışı, PDF yükleme, analiz sonucu, geçmiş ekranı gibi ekranlardan alınabilir.
- Metin veya çerçeve ekleyebilirsiniz; yanıltıcı veya tıbbi iddia içeren ifadeler kullanmayın.

---

## 5. Kontrol listesi (Sprint 12.2)

- [ ] Uygulama adı belirlendi; gerekirse `strings.xml` ile uyumlu
- [ ] Kısa açıklama (80 kr) Türkçe ve İngilizce yazıldı; tıbbi iddia yok
- [ ] Uzun açıklama (4000 kr) Türkçe ve İngilizce yazıldı; "bilgilendirme amaçlı" / "tıbbi tavsiye değildir" eklendi
- [ ] Uygulama ikonu 512x512 hazırlandı ve Play Console’a yüklendi
- [ ] Feature graphic 1024x500 hazırlandı ve yüklendi
- [ ] En az 2 ekran görüntüsü yüklendi (farklı ekranlar/cihazlar)
- [ ] Açıklama ile uygulamanın gerçek işlevi uyumlu (yanıltıcı değil)

Bu maddeler tamamlandığında Sprint 12.3’e geçebilirsiniz.

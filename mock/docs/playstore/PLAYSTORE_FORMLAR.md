# Play Console – Yasal ve Form Rehberi (Sprint 12.3)

Play Console’da **Politika ve programlar** / **Uygulama içeriği** altında doldurulacak formlar. Gizlilik politikası metni zaten `mock/PRIVACY_POLICY.md` içinde; sayfayı yayınlayıp URL’i store ve .env’de belirtmeniz yeterli.

---

## 1. Veri güvenliği formu (Data safety)

Play Console → Uygulamanız → **Uygulama içeriği** → **Veri güvenliği**.

Aşağıdaki tablo, uygulamanızın topladığı verilerle uyumludur. Formda bu maddeleri işaretleyin ve kısa açıklama ekleyin.

| Veri türü | Toplanıyor mu? | Amaç | Paylaşım |
|-----------|----------------|------|----------|
| **E-posta adresi** | Evet | Hesap oluşturma, giriş | Hayır (sadece sizin sunucunuzda) |
| **Ad / soyad** | Evet (kayıt sırasında) | Hesap kimliği | Hayır |
| **Şifre** | Evet | Kimlik doğrulama | Hayır, şifrelenmiş saklanır |
| **Sağlık / tıbbi veri** | Evet | Tahlil PDF’lerinden çıkarılan metin ve analiz; hizmet sunumu | Evet – analiz için OpenAI (ABD) ile paylaşılır; gizlilik politikasında açıklandı |
| **Uygulama etkileşimi** (analytics) | İsteğe bağlı / planlanan | Hizmet iyileştirme | Gerekirse “Evet” veya “Hayır” (şu an analytics varsa işaretleyin) |
| **Cihaz veya kimlik bilgisi** | Kurulum kimliği (anonim) | Hizmet sunumu | Gerekirse belirtin |

**Nasıl doldurulur:**
- “Veri toplanıyor mu?” → **Evet**
- “Hangi veriler?” → Yukarıdaki kategorilere göre işaretleyin (Kişisel bilgiler: e-posta, ad; Sağlık verisi: tahlil/analiz verisi).
- “Veri paylaşılıyor mu?” → Sağlık verisi için **Evet**, OpenAI ile paylaşım; açıklama alanına: “Tahlil analizi hizmeti için ABD merkezli OpenAI’e aktarılır; gizlilik politikasında açıklanmıştır.”
- “Veri şifrelenir mi?” → Hassas veriler için **Evet** (transit’te HTTPS, şifre hash’li).
- Gizlilik politikası URL’ini mutlaka ekleyin.

---

## 2. İçerik derecelendirmesi (Content rating)

Play Console → **Uygulama içeriği** → **İçerik derecelendirmesi**.

- **Anket:** “İçerik derecelendirmesi anketi”ni başlatın; sorulara uygulamanıza göre cevap verin.
- **Sağlık / tıbbi:** Tahlil sonuçları ve sağlıkla ilgili bilgi gösterildiği için ilgili sorularda “Evet” işaretleyin; anket genellikle **PEGI 3** veya **Genel** benzeri bir sonuç verir. Yaş sınırı çıkarsa store’da görünür.
- Anketi bitirip derecelendirmeyi kaydedin; yayın öncesi zorunludur.

---

## 3. Gizlilik politikası sayfası

- **URL:** Gizlilik politikası sayfanızın **canlı ve herkese açık** URL’i gerekli (örn. GitHub Pages, kendi siteniz).
- **İçerik:** `mock/PRIVACY_POLICY.md` içinde aşağıdakiler zaten var:
  - Toplanan veriler (hesap, sağlık verisi, teknik veriler)
  - Sağlık verisi (KVKK md. 6, açık rıza)
  - OpenAI’e aktarım (ABD, analiz hizmeti)
  - Veri saklama ve silme
  - KVKK hakları (bilgi, düzeltme, silme, itiraz, şikâyet)

**Yapmanız gereken:** Bu metni bir sayfada yayınlayın (GitHub Pages: repo → Settings → Pages → branch ve klasör seçin; veya `docs/` içine `PRIVACY_POLICY.md` koyup `docs/privacy` gibi bir URL ile erişilebilir yapın). Sonra:
- Play Console’da “Gizlilik politikası” alanına bu URL’i girin.
- `env-examples/env.production` ve canlı `.env` içinde `PRIVACY_POLICY_URL` olarak aynı URL’i set edin.

---

## 4. Sprint 12.3 kontrol listesi

- [ ] **Veri güvenliği formu** dolduruldu (toplanan veriler, sağlık verisi, OpenAI paylaşımı, gizlilik politikası URL’i)
- [ ] **İçerik derecelendirmesi** anketi tamamlandı, sonuç kaydedildi
- [ ] Gizlilik politikası sayfası yayında; URL Play Console ve .env’de gerçek adres olarak girildi
- [ ] Gizlilik politikası metninde sağlık verisi ve OpenAI/üçüncü taraf açıklaması net (mevcut PRIVACY_POLICY.md ile uyumlu)

Bu maddeler tamamlandığında Sprint 12.4’e geçebilirsiniz.

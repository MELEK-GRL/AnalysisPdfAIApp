# PDF AI App – Ana Plan Özeti

## Proje Niteliği

**Kapsamlı / portföy projesi.** Bu nedenle:
- **Clean code** ve **sağlam mimari** önceliklidir
- **Güvenlik önemli** – JWT, input doğrulama, rate limit, KVKK uyumu
- **Karmaşık kod yazılmaz** – basit, okunabilir, sade yapı
- Katmanlı yapı, servis ayrımı, tek sorumluluk ilkesi uygulanacak
- **UI değişikliği:** Şimdilik mevcut tasarım korunacak. UI, kullanıcı talep ettiğinde güncellenecek.

---

## Platform Gereksinimi

**iOS ve Android uyumluluğu zorunludur.** Tüm geliştirmeler her iki platformda da test edilecek ve çalışacak şekilde yapılacaktır.

---

## Teknoloji Stack (Değişmeyecek)

- **Mobil:** React Native, TypeScript, Zustand, Axios, React Navigation (iOS + Android)
- **Paket yöneticisi:** Yarn (backend ve client)
- **Backend:** Node.js, Express 5, Mongoose
- **Veritabanı:** MongoDB
- **AI:** OpenAI API (gpt-4o-mini)
- **PDF:** pdf-parse, multer
- **Auth:** JWT, bcryptjs
- **Test:** Jest (mevcut), supertest (backend)

---

## Hedef

- 24 saatte 2 PDF analizi limiti (OpenAI)
- Ayarlar sayfası: Dil desteği (Türkçe varsayılan, İngilizce)
- Her analiz geçmişte tutulacak
- KVKK sözleşmesi revizyonu
- Analytics: tıklama, login sayısı, sayfa süresi
- Test altyapısı (.test dosyaları)
- Clean code
- **Play Store yayını** – yayın sırasında sorun yaşanmaması için tüm gereksinimler karşılanacak

---

## Fazlar

**Durum:** Faz 10 eklendi. Faz 11 – Canlı öncesi teknik düzeltmeler tamamlandı.

| Faz | İçerik | Durum |
|-----|--------|-------|
| 0 | Mock klasör, planlama dokümanları | ✓ |
| 1 | Rate limit (24h/2), LabHistory, geçmiş endpoint | ✓ |
| 2 | KVKK sözleşme revizyonu, gizlilik politikası | ✓ |
| 3 | Analytics (tıklama, login, sayfa süresi) | ✓ |
| 4 | Backend + mobil testler | ✓ |
| 5 | Clean code refaktör | ✓ |
| 6 | **Geliştirme tamamlama** – bug fix, stabilite, temizlik | ✓ |
| 8 | **Hata düzeltmeleri / İyileştirmeler** – Geçmiş API hataları, UX | ✓ |
| **9** | **Tipografi, ikon standardizasyonu, bottom menü** – Text/Title tek yerden, ikonlar standart, tab bar şık tasarım ve tıklanma alanları | ✓ |
| **10** | **Dev / UAT / Prod ortamları** – Git dalları, env dosyaları, backend deploy URL’leri. Dev’de 24h/2 analiz limiti yok; UAT ve Prod’da geçerli. | bekliyor |
| **11** | **Canlı öncesi teknik düzeltmeler** – CORS (CLIENT_ORIGIN), JWT/Mongo production kontrolü, PDF fileFilter, Express error handler, __early/__routes sadece dev, gizlilik URL env | ✓ |
| **7 (Son Faz)** | **Play Store / Canlı yayın hazırlığı** – ertelendi, canlıya alınacak zaman | ertelendi |

---

## Mimari Prensipler

- **Basitlik:** Karmaşık çözümlerden kaçınılır, kod sade ve okunabilir olacak
- **Katmanlı yapı:** Controller → Service → Model (backend); Screen → Component → API (client)
- **Tek sorumluluk:** Her modül/fonksiyon tek bir işe odaklanır
- **DRY:** Kod tekrarı minimize edilir
- **Constants:** Magic string/sayılar constants dosyalarında toplanır
- **Projeye uyum:** Parametre, değişken ve fonksiyon isimleri mevcut proje yapısına ve naming kurallarına uygun olacak
- **Uyum ve senkronizasyon:** Backend–client, modeller–API, ekran–component arasında tutarlılık sağlanacak; API contract, response format ve veri akışı birbiriyle uyumlu olacak

## Play Store Hazırlık *(Son Faz – ertelendi)*

**Not:** Geliştirme bitmedi, uygulama canlıya hazır değil. Bu maddeler son faza alındı.

Yayın sırasında sorun yaşanmaması için:
- Gizlilik politikası URL (zorunlu)
- Veri güvenliği formu – sağlık verisi toplama beyanı
- Tıbbi iddialardan kaçınma (açıklamalar, store metni)
- Release signing, targetSdkVersion güncel
- Tüm checklist maddeleri tamamlanacak (PLAYSTORE_CHECKLIST.md)

---

## Güvenlik

- JWT (requireAuth), bcrypt ile şifre hash
- Input doğrulama (validator)
- Rate limiting (express-rate-limit)
- CORS, Helmet
- KVKK: sağlık verisi, açık rıza, veri güvenliği

---

## Mimari Özet

- **Backend**: Rate limit middleware, LabHistory modeli, GET /api/labs/history
- **Client**: getLabHistory API, 429 handling, Bottom tab (Analiz + Geçmiş), liste → detay modal, analytics servisi, useScreenTime
- **KVKK**: Articles.json revizyonu, sağlık verisi ve OpenAI aktarımı açık rıza
- **Analytics**: AppAnalytics modeli, POST /api/analytics, trackEvent/trackScreenView/trackButtonClick

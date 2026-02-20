# Sprint Task Listesi

**Kurallar:**
- Her task tamamlanınca yanına `✓ Tamamlandı` yazılacak. Sonraki task'a geçmeden önce kullanıcıdan izin alınacak.
- **iOS ve Android uyumluluğu zorunludur.** Tüm mobil değişiklikler her iki platformda da çalışmalı.
- **Clean code + iyi mimari** zorunludur (kapsamlı/portföy projesi).
- **Güvenlik önemli**, **karmaşık kod yazılmayacak** – basit ve sade tutulacak.
- **Parametreler ve isimlendirme** mevcut projeye uyumlu olacak.
- **Uyum ve senkronizasyon** önemli: backend–client, API–model, ekran–component ilişkileri tutarlı olacak.
- **UI:** Mevcut tasarım korunacak. UI değişikliği yalnızca kullanıcı talep ettiğinde yapılacak.

---

## FAZ 0 – Hazırlık

### Sprint 0.1 – Mock klasör yapısı
- [ ] Mock klasörü oluştur: `mock/`, `mock/data/`
- [ ] README.md, PLAN.md, SPRINTS.md, PLAYSTORE_CHECKLIST.md ekle
- [ ] mock/data/: users.json, labResults.json, analyses.json şablonları

**→ Tamamlandıktan sonra izin al, Sprint 0.2'ye geç**

---

### Sprint 0.2 – Dokümantasyon tamamlama
- [ ] README.md içeriğini genişlet (kullanım, klasör açıklaması)
- [ ] PLAN.md'de faz detaylarını netleştir
- [ ] PLAYSTORE_CHECKLIST.md maddelerini detaylandır

**→ Tamamlandıktan sonra izin al, Faz 1'e geç**

---

## FAZ 1 – Rate Limit ve Analiz Geçmişi

### Sprint 1.1 – LabHistory modeli
- [ ] `PdfAIServer/src/models/LabHistory.js` oluştur
- [ ] Schema: user (ObjectId), items (LabItem[]), analysis (String), fileName (String?), createdAt (Date)
- [ ] Index: { user: 1, createdAt: -1 }

**→ Tamamlandıktan sonra izin al, Sprint 1.2'ye geç**

---

### Sprint 1.2 – Rate limit middleware
- [ ] `PdfAIServer/src/middleware/dailyAnalysisLimit.js` oluştur
- [ ] 24 saat içinde max 2 analiz kontrolü (LabHistory count)
- [ ] Aşımda: 429 + { message, resetsAt }

**→ Tamamlandıktan sonra izin al, Sprint 1.3'e geç**

---

### Sprint 1.3 – Upload route güncellemesi
- [ ] upload.js: dailyAnalysisLimit middleware ekle
- [ ] Başarılı analiz sonrası LabHistory.create() çağrısı
- [ ] LatestLabResult upsert (mevcut mantık korunsun)

**→ Tamamlandıktan sonra izin al, Sprint 1.4'e geç**

---

### Sprint 1.4 – GET /api/labs/history endpoint
- [ ] labs.js: GET /history route ekle (requireAuth)
- [ ] Pagination: limit, skip query params
- [ ] Kullanıcının LabHistory kayıtlarını dön

**→ Tamamlandıktan sonra izin al, Sprint 1.5'e geç**

---

### Sprint 1.5 – Client: Lab API ve 429 handling (iOS + Android)
- [ ] Lab.ts: getLabHistory(limit?, offset?) fonksiyonu
- [ ] uploadPdf: 429 response handling, uygun hata mesajı
- [ ] Home: 429 durumunda bilgilendirme modalı

**→ Tamamlandıktan sonra izin al, Sprint 1.6'ya geç**

---

### Sprint 1.6 – Bottom menü + Tahlil Geçmişi UI (iOS + Android)

**Kural:** Mevcut Home ekranı tasarımı korunacak; sadece bottom tab yapısı ve geçmiş ekranı eklenecek.

**Bottom Tab Navigator (2 sekme):**
1. **Analiz** – PDF yükleme ve tahlil raporu analizi yapılan ekran (mevcut Home)
2. **Geçmiş** – Geçmiş analizleri listeleyen ekran

**Geçmiş ekranı:**
- [ ] Liste: kullanıcının LabHistory kayıtları (tarih, dosya adı vb.)
- [ ] Listede bir öğeye tıklanınca → **CenterModal** açılır
- [ ] CenterModal: analiz içeriği (items + analysis metni) detay gösterimi ✓ Tamamlandı

**Navigasyon:**
- [ ] `@react-navigation/bottom-tabs` paketi ekle (yarn add)
- [ ] React Navigation Bottom Tabs (createBottomTabNavigator)
- [ ] Uygulama stiline uygun ikon ve etiketler
- [ ] iOS + Android uyumlu

**→ Tamamlandıktan sonra izin al, Sprint 1.6.1'e geç**

---

### Sprint 1.6.1 – İyileştirme: PopupModal bileşeni ✓ Tamamlandı
- [x] PopupModal oluştur (CenterModal benzeri, type: info | warning | error | success)
- [x] mock/POPUPMODAL.md dokümantasyonu
- [x] Tüm uyarı/alert ekranlarında CenterModal → PopupModal dönüşümü

**→ Tamamlandı. Sprint 1.7'ye geç**

---

### Sprint 1.7 – Ayarlar sayfası + Dil desteği (iOS + Android) ✓ Tamamlandı

**Ayarlar sayfası:**
- [x] Ayarlar ekranı (Header settings ikonu → Settings)
- [x] Dil seçeneği: Türkçe (varsayılan) / English
- [x] Çıkış Yap butonu (Logout'a yönlendirme)

**Dil desteği (basit, karmaşık kütüphane yok):**
- [x] Basit dil anahtarları: locales/tr.json, locales/en.json
- [x] useLocaleStore (Zustand + persist) ile AsyncStorage'da dil saklama
- [x] t(key) ile dil dosyalarından metin okuma
- [x] Varsayılan: Türkçe

**Kapsam:** Login, Register, Home, Geçmiş, Logout, SplashTwo, Settings, modallar, tab etiketleri

**→ Tamamlandı. Faz 2'ye geç**

---

## FAZ 2 – KVKK ve Sözleşme

### Sprint 2.1 – Articles.json sağlık verisi maddesi
- [x] Sağlık verisi (tahlil PDF) KVKK 6 özel nitelikli veri açıklaması
- [x] Açık rıza ile işlendiği ifadesi
- [x] Veri saklama süresi
- [x] Veri sorumlusu kimliği

**→ Tamamlandıktan sonra izin al, Sprint 2.2'ye geç**

---

### Sprint 2.2 – Articles.json OpenAI aktarımı
- [x] Verilerin OpenAI'e aktarıldığının açık metni
- [x] Üçüncü taraf veri işleme maddesi güncellemesi

**→ Tamamlandıktan sonra izin al, Sprint 2.3'e geç**

---

### Sprint 2.3 – Gizlilik politikası ve Consent
- [x] Gizlilik politikası metni (ayrı dosya veya web URL)
- [x] Consent.termsVersion sürüm takibi
- [x] KVKK 11 haklar: bilgi talep, silme, itiraz, başvuru yöntemi

**→ Tamamlandıktan sonra izin al, Faz 3'e geç**

---

## FAZ 3 – Analytics ✓

### Sprint 3.1 – AppAnalytics modeli ve endpoint ✓ Tamamlandı
- [x] AppAnalytics modeli: user, eventType, screenName?, buttonId?, durationSeconds?, meta?, createdAt
- [x] POST /api/analytics (requireAuth, rate limit)
- [x] Route mount

**→ Tamamlandı. Sprint 3.2'ye geç**

---

### Sprint 3.2 – Client analytics servisi (iOS + Android) ✓ Tamamlandı
- [x] analytics.ts: trackEvent, trackScreenView, trackButtonClick
- [x] useScreenTime hook
- [x] KVKK opt-out: rıza yoksa gönderme (CONSENT_GIVEN_ONCE kontrolü)

**→ Tamamlandı. Sprint 3.3'e geç**

---

### Sprint 3.3 – Analytics entegrasyonu (iOS + Android) ✓ Tamamlandı
- [x] Ekranlarda useScreenTime ile trackScreenView
- [x] Login: trackEvent('login')
- [x] Home: useScreenTime, butonlara trackButtonClick
- [x] Login sayacı (analytics 'login' eventType ile)

**→ Tamamlandı. Faz 4'e geç**

---

## FAZ 4 – Testler

**Not:** Mevcut teknolojiler kullanılacak (Jest, supertest). Yeni test framework eklenmeyecek.

### Sprint 4.1 – Backend test altyapısı ✓ Tamamlandı
- [x] Jest + supertest kurulumu (PdfAIServer)
- [x] jest.config.js, __tests__/setup.js
- [x] Mock: openai, pdf (upload/dailyAnalysisLimit testlerinde)

**→ Tamamlandı. Sprint 4.2'ye geç**

---

### Sprint 4.2 – Backend test dosyaları ✓ Tamamlandı
- [x] auth.test.js (termsAccepted ile güncellendi)
- [x] upload.test.js
- [x] labs.test.js
- [x] analytics.test.js (requireAuth ile güncellendi)
- [x] dailyAnalysisLimit.test.js
- [x] health.test.js

**→ Tamamlandı. Sprint 4.3'e geç**

---

### Sprint 4.3 – Client test dosyaları (her iki platform için geçerli) ✓ Tamamlandı
- [x] Login.test.tsx
- [x] Home.test.tsx
- [x] Button.test.tsx
- [x] Lab.test.ts (API mock)
- [x] App.test.tsx

**→ Tamamlandı. Faz 5'e geç**

---

## FAZ 5 – Clean Code ve Mimari

**Hedef:** Kapsamlı proje için sürdürülebilir, okunabilir kod ve net mimari.

### Sprint 5.1 – Home refaktör (iOS + Android uyumlu) ✓ Tamamlandı
- [x] PdfUploadSection, ResultSection bileşenleri (UI aynı, parçalama)
- [x] Modals Home içinde PopupModal ile (ResultSection içinde interpret modal)
- [x] constants/limits.ts, constants/messages.ts
- [x] Client: MESSAGES.uploadError kullanımı

**→ Tamamlandı. Sprint 5.2'ye geç**

---

### Sprint 5.2 – Genel clean code ve mimari ✓ Tamamlandı
- [x] Backend: upload route servis katmanı (uploadAnalysis.js: runAnalysis, persistResult, analyzeAndSave)
- [x] Controller → service → model: route ince, servis iş mantığı taşıyor
- [ ] ESLint kuralları gözden geçirme (opsiyonel)
- [ ] Gereksiz console.log temizliği (opsiyonel)
- [ ] Kod tekrarlarının kaldırılması (DRY) (kısmen)

**→ Tamamlandı. Faz 6 tamamlandı.**

---

## FAZ 6 – Geliştirme Tamamlama ✓

### Yapılanlar
- [x] console.log/error/warn __DEV__ ile sarıldı (production'da sessiz)
- [x] App.tsx: Arka plana geçince session temizleme düzeltildi (logout kullanılıyor)
- [x] App.tsx: Gereksiz yorum kaldırıldı
- [x] Home.test.tsx eklendi

---

## FAZ 8 – Hata Düzeltmeleri / İyileştirmeler

### Sprint 8.1 – Geçmiş / API Hata Düzeltmesi ✓ Tamamlandı

**Sorun:** Geçmiş sekmesinde "Geçmiş yüklenemedi. Lütfen tekrar deneyin." hatası, backend erişilemez olduğunda veya ağ sorununda tetikleniyor.

### Görevler
- [x] Geçmiş yükleme hatası: Daha açıklayıcı mesaj (örn. "Sunucuya bağlanılamadı. İnternet bağlantınızı ve backend'in çalıştığını kontrol edin.")
- [x] Hata modalında "Tekrar Dene" butonu ekle (fetchHistory yeniden çağrılsın)
- [x] Ağ hatası (Network Error, timeout) ile sunucu hatası (401, 500) ayrımı – kullanıcıya uygun mesaj
- [x] Tab bar ikonları: Ionicons eklendi – fonts.gradle ve Info.plist doğrulandı

**→ Tamamlandı. Sprint 8.2 zaten tamamlanmıştı.**

---

### Sprint 8.2 – Gizlilik politikası Ayarlar'dan kaldırma

**Bağlam:** Gizlilik politikası kullanıcı kayıt olmadan önce SplashTwo ekranında kabul edilir ve DB'ye eklenir.

**Görev:**
- [x] Ayarlar ekranından "Gizlilik Politikası" satırını kaldır (SplashTwo'da zaten kabul ediliyor) ✓ Tamamlandı

**→ Tamamlandıktan sonra izin al, Sprint 8.3'e geç**

---

### Sprint 8.3 – Çıkış Yap onay modalı ✓ Tamamlandı

**Görev:**
- [x] Ayarlar'da "Çıkış Yap" tıklandığında önce onay modalı göster: "Oturumu kapatmak istiyor musun?" – "Evet, Çıkış Yap" / "Vazgeç"

**→ Tamamlandı. Bir sonraki sprinte geç.**

---

### Sprint 8.4 – *(ileride eklenebilir)*

---

## FAZ 9 – Tipografi ve İkon Standardizasyonu

**Hedef:** Proje genelinde text, title ve diğer yazı boyutları app standartlarında, tek yerden kontrol edilecek şekilde revize edilecek. İkonlar yazı boyutlarına göre standardize edilecek. Bottom menü tasarımı daha şık hale getirilecek, kullanıcı tıklanma alanları yeterli olacak (min. 44pt iOS / 48dp Android).

### Sprint 9.1 – Tipografi constants (tek yerden kontrol) ✓ Tamamlandı
- [x] `constants/typography.ts` oluştur: `fontSize` değerleri (titleLarge, title, subtitle, body, bodySmall, caption, label vb.)
- [x] App standartlarına uygun skala belirle (örn. 10–12 caption, 14 body, 16 subtitle, 18–20 title, 24 titleLarge)
- [x] T bileşeni ve diğer text kullanımları bu constants’tan beslenecek
- [x] `constants/icons.ts` oluşturuldu; typography tüm projede kullanılıyor

**→ Tamamlandıktan sonra izin al, Sprint 9.2'ye geç**

---

### Sprint 9.2 – Proje genelinde text boyutları revize ✓ Tamamlandı
- [x] Header, Home, Settings, History, Login, Register, SplashTwo, PrivacyPolicy
- [x] Modaller (PopupModal, CenterModal, DetailModal), Chart, Button, TextInputComponent, Pdf
- [x] Tüm hardcoded `size={…}` değerleri typography constants ile değiştir
- [x] AppNavigator tabBarLabelStyle typography ile uyumlu

**→ Tamamlandıktan sonra izin al, Sprint 9.3'e geç**

---

### Sprint 9.3 – İkon boyutları standardizasyonu ✓ Tamamlandı
- [x] `constants/icons.ts` ikon boyutları: iconSmall (16), iconMedium (20), iconLarge (24), iconXl (28), iconXxl (48)
- [x] Ionicons ve Image ikonları standart boyutlara çek
- [x] Header settings, tab bar, Settings arrow-back, History detay ikonları, Home ikonları
- [x] İkon boyutları text scale ile orantılı

**→ Tamamlandıktan sonra izin al, sonraki sprinte geç**

---

### Sprint 9.4 – Bottom menü tasarımı ve tıklanma alanları ✓ Tamamlandı
- [x] Tab bar tasarımı: arka plan, gölge, border, aktif/pasif durumların görsel ayrımı
- [x] Aktif sekmede belirgin vurgu (#7453E0), pasif durumda dengeli görünüm
- [x] Tıklanma alanları: tabBarItemStyle minHeight: 48
- [x] tabBarStyle (gölge, border), tabBarItemStyle ile alan genişletme
- [x] İkon ve label typography/icon constants ile uyumlu

**→ Tamamlandıktan sonra izin al, sonraki sprinte geç**

---

### Sprint 9.5 – *(opsiyonel, gerekirse eklenebilir)*
- [ ] *(madde)*

---

## FAZ 10 – Dev / UAT / Prod Ortamları

**Hedef:** Geliştirme (dev), kabul testi (uat) ve canlı (prod) ortamlarını ayırmak. Git dalları, env dosyaları ve backend URL yapılandırması. **Rate limit:** Dev ortamında 24 saatte 2 sorgu kuralı uygulanmayacak (test için sınırsız); UAT ve Prod’da geçerli olacak.

### Sprint 10.1 – Git dalları
- [ ] `dev` dalı oluştur (main’den fork, günlük geliştirme)
- [x] `uat` dalı oluştur (test / kabul için)
- [x] `main` = prod (canlı, sadece merge ile güncellenir)
- [ ] Branches koruma kuralları (opsiyonel): main’e direkt push kısıtı

**→ Tamamlandıktan sonra izin al, Sprint 10.2’ye geç**

---

### Sprint 10.2 – Backend env yapısı (PdfAIServer) ✓ Tamamlandı
- [x] `.env.example` güncellendi: MONGODB_URI, JWT_SECRET, OPENAI_API_KEY, PORT, NODE_ENV, DB_NAME
- [ ] Ortamlara göre:
  - **dev**: local MongoDB, test key (veya geliştirme OpenAI key), NODE_ENV=development
  - **uat**: ayrı Atlas cluster veya ayrı DB, staging URL, NODE_ENV=production (veya uat)
  - **prod**: production Atlas, production key, NODE_ENV=production
- [ ] **Rate limit:** `NODE_ENV=development` iken 24h/2 analiz limiti devre dışı; UAT ve Prod’da aktif
- [ ] Hosting: UAT ve Prod için ayrı servisler (örn. Render’da 2 servis: pdfai-uat, pdfai-prod)

**→ Tamamlandıktan sonra izin al, Sprint 10.3’e geç**

---

### Sprint 10.3 – Mobil env yapısı (PdfAICli)
- [ ] `.env.example` oluştur: API_BASE_URL
- [ ] Ortam dosyaları (gitignore’da kalacak, commit edilmez):
  - `.env.development` → `http://10.0.2.2:4000` (Android emülatör) veya Mac IP
  - `.env.uat` → UAT backend URL (örn. `https://pdfai-uat.onrender.com`)
  - `.env.production` → Prod backend URL (örn. `https://pdfai-prod.onrender.com`)
- [ ] Babel veya build script: ortam seçimi (env-copy script veya react-native-dotenv path override)
- [ ] Basit çözüm: `cp .env.development .env` ile manuel geçiş; veya `APP_ENV=uat yarn start` gibi script

**→ Tamamlandıktan sonra izin al, Sprint 10.4’e geç**

---

### Sprint 10.4 – Dokümantasyon ve doğrulama ✓ Tamamlandı
- [x] `mock/ENVIRONMENTS.md` – ortam kurulum rehberi, hızlı başlangıç
- [ ] README veya ENVIRONMENTS’a “Ortam nasıl değiştirilir?” maddesi
- [ ] Dev, UAT, Prod için akış doğrulaması (login, PDF analizi)

---

## FAZ 11 – Canlı öncesi teknik düzeltmeler

### Sprint 11.1 – Canlı öncesi eksikler ✓ Tamamlandı
- [x] CORS: Production'da CLIENT_ORIGIN ile kısıtlama (app.js)
- [x] JWT_SECRET ve MONGODB_URI production'da zorunlu, startup'ta kontrol (index.js)
- [x] Multer PDF fileFilter – sadece application/pdf kabul (upload.js)
- [x] Express merkezi error handler (app.js)
- [x] __early / __routes sadece NODE_ENV !== 'production' (app.js)
- [x] Gizlilik politikası URL env'den (PRIVACY_POLICY_URL, appUrls.ts, env-examples)

**→ Tamamlandı. Faz 7 (Son Faz) veya sonraki sprinte geçilebilir.**

---

## FAZ 7 – Play Store Hazırlık *(ertelendi – canlıya alınacak zaman)*

### Sprint 7.1 – Teknik hazırlık
- [ ] versionCode, versionName
- [ ] ProGuard/R8 release config
- [ ] API_BASE_URL production
- [ ] express-rate-limit production aktif

**→ Ertelemede**

---

### Sprint 7.2 – Store materyalleri (Play Store + App Store)
- [ ] Uygulama ikonu: Android adaptive, iOS gerekli boyutlar
- [ ] Ekran görüntüleri
- [ ] Store açıklamaları (Türkçe)
- [ ] Gizlilik politikası URL

**→ Ertelemede**

---

### Sprint 7.3 – Yasal ve final kontrol (Yayın sorunsuz olsun)
- [ ] İçerik derecelendirmesi
- [ ] Veri güvenliği formu (Play Console)
- [ ] Gizlilik politikası URL erişilebilir
- [ ] Tıbbi iddia yok (store metni, uygulama)
- [ ] PLAYSTORE_CHECKLIST.md tüm maddeler tamamlandı
- [ ] Yayın öncesi manuel akış testi

**→ Ertelemede. Canlıya alınacak zaman uygulanacak.**

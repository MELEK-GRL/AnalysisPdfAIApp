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

## FAZ 3 – Analytics

### Sprint 3.1 – AppAnalytics modeli ve endpoint
- [ ] AppAnalytics modeli: user, eventType, screenName?, buttonId?, durationSeconds?, meta?, createdAt
- [ ] POST /api/analytics (requireAuth, rate limit)
- [ ] Route mount

**→ Tamamlandıktan sonra izin al, Sprint 3.2'ye geç**

---

### Sprint 3.2 – Client analytics servisi (iOS + Android)
- [ ] analytics.ts: trackEvent, trackScreenView, trackButtonClick
- [ ] useScreenTime hook
- [ ] KVKK opt-out: rıza yoksa gönderme

**→ Tamamlandıktan sonra izin al, Sprint 3.3'e geç**

---

### Sprint 3.3 – Analytics entegrasyonu (iOS + Android)
- [ ] AppNavigator: ekran geçişinde trackScreenView
- [ ] Login: trackEvent('login')
- [ ] Home: useScreenTime, butonlara trackButtonClick
- [ ] Login sayacı (backend veya analytics üzerinden)

**→ Tamamlandıktan sonra izin al, Faz 4'e geç**

---

## FAZ 4 – Testler

**Not:** Mevcut teknolojiler kullanılacak (Jest, supertest). Yeni test framework eklenmeyecek.

### Sprint 4.1 – Backend test altyapısı
- [ ] Jest + supertest kurulumu (PdfAIServer)
- [ ] jest.config.js
- [ ] Mock: openai, pdf-parse

**→ Tamamlandıktan sonra izin al, Sprint 4.2'ye geç**

---

### Sprint 4.2 – Backend test dosyaları
- [ ] auth.test.js
- [ ] upload.test.js
- [ ] labs.test.js
- [ ] dailyAnalysisLimit.test.js

**→ Tamamlandıktan sonra izin al, Sprint 4.3'e geç**

---

### Sprint 4.3 – Client test dosyaları (her iki platform için geçerli)
- [ ] Login.test.tsx
- [ ] Home.test.tsx
- [ ] Button.test.tsx
- [ ] Lab.test.ts (API mock)

**→ Tamamlandıktan sonra izin al, Faz 5'e geç**

---

## FAZ 5 – Clean Code ve Mimari

**Hedef:** Kapsamlı proje için sürdürülebilir, okunabilir kod ve net mimari.

### Sprint 5.1 – Home refaktör (iOS + Android uyumlu)
- [ ] PdfUploadSection, ResultSection bileşenleri (UI aynı, sadece parçalama)
- [ ] Modals ayrı component veya grupla
- [ ] constants/limits.ts, constants/messages.ts
- [ ] Servis katmanı: API çağrıları, iş mantığı ayrımı

**→ Tamamlandıktan sonra izin al, Sprint 5.2'ye geç**

---

### Sprint 5.2 – Genel clean code ve mimari
- [ ] Backend: upload route servis katmanı (controller → service → model)
- [ ] ESLint kuralları gözden geçirme
- [ ] Gereksiz console.log temizliği
- [ ] Kod tekrarlarının kaldırılması (DRY)

**→ Tamamlandıktan sonra izin al, Faz 6'ya geç**

---

## FAZ 6 – Play Store Hazırlık

### Sprint 6.1 – Teknik hazırlık
- [ ] versionCode, versionName
- [ ] ProGuard/R8 release config
- [ ] API_BASE_URL production
- [ ] express-rate-limit production aktif

**→ Tamamlandıktan sonra izin al, Sprint 6.2'ye geç**

---

### Sprint 6.2 – Store materyalleri (Play Store + App Store)
- [ ] Uygulama ikonu: Android adaptive, iOS gerekli boyutlar
- [ ] Ekran görüntüleri
- [ ] Store açıklamaları (Türkçe)
- [ ] Gizlilik politikası URL

**→ Tamamlandıktan sonra izin al, Sprint 6.3'e geç**

---

### Sprint 6.3 – Yasal ve final kontrol (Yayın sorunsuz olsun)
- [ ] İçerik derecelendirmesi
- [ ] Veri güvenliği formu (Play Console)
- [ ] Gizlilik politikası URL erişilebilir
- [ ] Tıbbi iddia yok (store metni, uygulama)
- [ ] PLAYSTORE_CHECKLIST.md tüm maddeler tamamlandı
- [ ] Yayın öncesi manuel akış testi

**→ Faz 6 tamamlandı. Play Store yayınına hazır.**

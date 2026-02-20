# Eksikler Listesi

Projede tamamlanması gereken eksikler aşağıda kategorilere göre listelenmiştir.

**Bu liste FAZ 12 – Play Store yayın eksikleri** olarak plana alındı. Sprint görevleri: **SPRINTS.md** → FAZ 12 (Sprint 12.1 – 12.4). Detaylı adımlar: **PLAYSTORE_GELISTIRMELER.md**, **PLAYSTORE_CHECKLIST.md**.

---

## 1. Play Store / Yayın (Zorunlu)

| # | Eksik | Açıklama | Nerede |
|---|--------|----------|--------|
| 1 | **Release keystore** | Production imza için keystore yok; release hâlâ debug ile imzalanıyor. | `android/app/build.gradle` – `signingConfigs.release` tanımlanmalı |
| 2 | **Gizlilik politikası URL** | Gerçek URL yok; `https://example.com/privacy` kabul edilmez. | `.env` ve env-examples’ta `PRIVACY_POLICY_URL` gerçek adres olmalı; `mock/PRIVACY_POLICY.md` bir yerde yayınlanmalı |
| 3 | **Production API** | Canlı backend URL’i uygulama build’inde set edilmeli. | `API_BASE_URL` production .env’de canlı sunucu adresi |
| 4 | **targetSdkVersion 35** | 2025 Play Store gereksinimi. Şu an 34. | `android/build.gradle` – 35 yapıp test et |
| 5 | **versionCode artışı** | Her yayında artırılmalı (şu an 1). | `android/app/build.gradle` – versionCode / versionName |

---

## 2. Store Listesi (Play Console)

| # | Eksik | Açıklama |
|---|--------|----------|
| 6 | Uygulama adı / açıklama | Kısa (80 kr), uzun (4000 kr); tıbbi iddia yok, “bilgilendirme amaçlı” vurgusu |
| 7 | Uygulama ikonu 512x512 | Play Console’da yüklenecek |
| 8 | Feature graphic 1024x500 | Android için |
| 9 | Ekran görüntüleri | En az 2, farklı cihaz boyutları |

---

## 3. Yasal / Play Console Formları

| # | Eksik | Açıklama |
|---|--------|----------|
| 10 | Veri güvenliği formu | Toplanan veriler (hesap, sağlık verisi, analytics) beyan edilecek |
| 11 | İçerik derecelendirmesi | Anket doldurulup tamamlanacak |
| 12 | Gizlilik politikası metni | Sağlık verisi, OpenAI/üçüncü taraf açıklaması sayfada net olmalı (zaten mock/PRIVACY_POLICY.md var; yayınlanıp URL verilmeli) |

---

## 4. Teknik / Test

| # | Eksik | Açıklama |
|---|--------|----------|
| 13 | Release build doğrulama | `./gradlew assembleRelease` veya `bundleRelease` başarılı ve test edilmiş olmalı |
| 14 | Production .env | Backend’te MongoDB URI, JWT_SECRET, rate-limit; client’ta API_BASE_URL, PRIVACY_POLICY_URL |
| 15 | usesCleartextTraffic | Production’da API HTTPS ise `false` yapılabilir (isteğe bağlı). | `AndroidManifest.xml` |

---

## 5. İsteğe Bağlı / İyileştirme

| # | Eksik | Açıklama |
|---|--------|----------|
| 16 | Uygulama adı (strings.xml) | Şu an "PdfAICli"; mağazada görünecek son isim belirlenip `android/app/src/main/res/values/strings.xml` ile uyumlu olabilir |
| 17 | ProGuard | Şu an release’de kapalı (`enableProguardInReleaseBuilds = false`). Açılırsa proguard kuralları test edilmeli |

---

## Özet Sayı

- **Zorunlu (yayın için):** 1–5  
- **Store listesi:** 6–9  
- **Yasal / formlar:** 10–12  
- **Teknik / test:** 13–15  
- **İsteğe bağlı:** 16–17  

Detaylı adımlar: **mock/PLAYSTORE_GELISTIRMELER.md** ve **mock/PLAYSTORE_CHECKLIST.md**.

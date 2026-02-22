# Play Store’a Yüklemeden Önce Yapılması Gereken Geliştirmeler

Bu liste, yayında red veya gecikme yaşamamak için tamamlanması gereken maddeleri toplar. Detaylı kontrol listesi için `mock/docs/playstore/PLAYSTORE_CHECKLIST.md` kullanılabilir.

---

## 1. Zorunlu Teknik Geliştirmeler

### 1.1 Release imzalama (keystore)
- **Şu an:** Release build hâlâ `signingConfigs.debug` kullanıyor; Play Store bunu kabul etmez.
- **Yapılacak:** Production keystore oluşturup `android/app/build.gradle` içinde tanımlayın.
  ```bash
  keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias pdfai -keyalg RSA -keysize 2048 -validity 10000
  ```
- `signingConfigs { release { ... } }` ekleyin ve `buildTypes.release.signingConfig signingConfigs.release` yapın.
- Keystore ve şifreleri **güvenli tutun**, repoya koymayın (CI’da environment variable kullanın).

### 1.2 versionCode / versionName
- **Şu an:** `versionCode 1`, `versionName "1.0"` (build.gradle).
- **Yapılacak:** Her Play Store güncellemesinde `versionCode` mutlaka artırılmalı (1, 2, 3...). versionName isterseniz "1.0.1", "1.1.0" gibi güncellenir.

### 1.3 targetSdkVersion (2025 gereksinimi)
- **Şu an:** targetSdk 34.
- **Yapılacak:** 2025 itibarıyla yeni uygulamalar ve güncellemeler için **targetSdkVersion 35** (Android 15) gerekiyor. `android/build.gradle` içinde `targetSdkVersion = 35` ve `compileSdkVersion = 35` yapıp test edin.

### 1.4 Production API ve .env
- **Yapılacak:**
  - Backend’i canlıya alın (Render, Railway, AWS vb.).
  - `PdfAICli/.env` (veya release build’e verilen env) içinde `API_BASE_URL` = canlı backend URL olmalı.
  - `env-examples/env.production` örnek; gerçek production URL ve `PRIVACY_POLICY_URL` bu yapıya uygun set edilmeli.

### 1.5 Gizlilik politikası URL
- **Şu an:** `appUrls.ts` fallback olarak `https://example.com/privacy` kullanıyor.
- **Yapılacak:** Gizlilik politikası metnini (sağlık verisi, analytics, üçüncü taraf paylaşımı) bir sayfada yayınlayın (GitHub Pages, kendi siteniz). `.env` ve store listesinde bu **gerçek URL** yazılmalı; “example.com” kabul edilmez.

### 1.6 Debug / log
- **Şu an:** `console.log` / `console.error` sadece `__DEV__` içinde kullanılıyor; release build’de bundle’da bu bloklar çalışmaz.
- **Yapılacak:** Ekstra `console.*` bırakmadığınızdan emin olun; gerekirse release’de log’ları tamamen kapatacak bir wrapper kullanın.

---

## 2. Store ve Yasal

- **Uygulama adı / açıklama:** Tıbbi tanı/teşhis iddiası olmasın; “bilgilendirme amaçlı”, “tıbbi tavsiye yerine geçmez” vurgusu olsun.
- **Gizlilik politikası:** Metinde sağlık verisi (lab PDF), analytics ve (varsa) OpenAI/üçüncü taraf aktarımı açıkça yazılsın.
- **Play Console – Veri güvenliği formu:** Toplanan veriler (hesap, sağlıkla ilgili veri, cihaz bilgisi vb.) doğru işaretlensin.
- **İçerik derecelendirmesi:** Anketi doldurup uygulama için uygun derecelendirmeyi alın.

---

## 3. İzinler

- **Şu an:** Sadece `INTERNET` (AndroidManifest) – uygun.
- **Dikkat:** `android:usesCleartextTraffic="true"` production’da sadece gerekliyse kalsın; API’niz HTTPS ise `false` yapılabilir. `network_security_config` zaten varsa oradan da kısıtlayabilirsiniz.

---

## 4. Yayın Öncesi Test

- Release build: `cd PdfAICli/android && ./gradlew assembleRelease` (veya App Bundle: `bundleRelease`).
- Akış: Giriş → Sözleşme/onay → PDF yükleme → Analiz → Geçmiş; Çıkış; Dil değişimi.
- Canlı backend URL ile test; rate limit (ör. 3. analizde 429) davranışı.

---

## 5. Özet Sıra

1. Production keystore + release signing.
2. `API_BASE_URL` ve `PRIVACY_POLICY_URL` production için set et.
3. Gizlilik politikası sayfası yayında, URL store ve .env’de doğru.
4. targetSdk 35’e çık (2025 gereksinimi).
5. versionCode artır, release build al, test et.
6. Store listesi (isim, açıklama, ikon 512x512, feature graphic, ekran görüntüleri).
7. Play Console: Veri güvenliği + içerik derecelendirmesi.

Bu maddeler tamamlandığında Play Store’a yüklemede teknik ve politika kaynaklı sorunlar büyük ölçüde önlenir.

# Faz 12 – Release Build ve Play Store Hazırlık

Bu dosya Sprint 12.1 teknik maddelerinin nasıl tamamlanacağını özetler.

---

## 1. Release keystore (ilk kez, bir defa)

Play Store’a yükleyeceğiniz APK/AAB imzalanmalı; release build için production keystore gerekir.

### Keystore oluşturma

```bash
cd PdfAICli/android/app
keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias pdfai -keyalg RSA -keysize 2048 -validity 10000
```

- İstendiğinde keystore ve key için **güçlü şifre** belirleyin.
- Bu dosya (`release.keystore`) repoya **eklenmez** (`.gitignore`’da `*.keystore` var).
- Keystore ve şifreleri güvenli yedekleyin; kaybederseniz uygulama güncellemesi yapılamaz.

### Release build alırken şifreleri verme

Şifreleri repoya koymayın; **ortam değişkeni** kullanın:

```bash
export PDFAI_RELEASE_STORE_PASSWORD="keystore_şifreniz"
export PDFAI_RELEASE_KEY_PASSWORD="key_şifreniz"
# İsteğe bağlı (varsayılan: android/app/release.keystore, alias: pdfai):
# export PDFAI_RELEASE_STORE_FILE="release.keystore"
# export PDFAI_RELEASE_KEY_ALIAS="pdfai"
cd PdfAICli/android
./gradlew assembleRelease
# veya App Bundle için: ./gradlew bundleRelease
```

APK: `PdfAICli/android/app/build/outputs/apk/release/app-release.apk`  
AAB: `PdfAICli/android/app/build/outputs/bundle/release/app-release.aab`

---

## 2. targetSdkVersion 35

`android/build.gradle` içinde `compileSdkVersion` ve `targetSdkVersion` **35** yapıldı (2025 Play Store gereksinimi). İlk release build sonrası test edin.

---

## 3. versionCode / versionName

- `android/app/build.gradle` → `defaultConfig.versionCode` ve `versionName`.
- **Her Play Store yayınında** `versionCode` mutlaka artırılmalı (1, 2, 3…).
- `versionName` isterseniz "1.0.1", "1.1.0" gibi güncellenir.

---

## 4. Production API ve gizlilik politikası URL

- **API_BASE_URL:** Canlı backend adresiniz. `yarn env:prod` ile `env-examples/env.production` kopyalanır; production build almadan önce `.env` içinde (veya env.production’da) gerçek URL’i set edin.
- **PRIVACY_POLICY_URL:** `mock/PRIVACY_POLICY.md` içeriğini GitHub Pages veya kendi hosting’inizde yayınlayın. Play Store ve `.env` / env-examples’ta **gerçek URL** yazılmalı; `https://example.com/privacy` kabul edilmez.

---

## 5. Release build öncesi kontrol

- [ ] Keystore oluşturuldu, şifreler ortam değişkeninde.
- [ ] `yarn env:prod` çalıştırıldı, `.env` içinde `API_BASE_URL` ve `PRIVACY_POLICY_URL` canlı değerler.
- [ ] `cd PdfAICli/android && ./gradlew assembleRelease` (veya `bundleRelease`) başarılı.
- [ ] Cihaz/emülatörde release APK ile akış testi: Giriş → PDF yükle → Analiz → Geçmiş.

Bunlar tamamsa Sprint 12.2 (Store listesi) ve 12.3–12.4’e geçebilirsiniz.

---

## 6. Dahili teste çıkış (Play Store Internal Testing)

Yeni sürümü production ortamıyla build alıp **Dahili test** track’ine almak için:

### 6.1 Sürüm artır

- `PdfAICli/android/app/build.gradle`: `versionCode` ve `versionName` artır (her yayında versionCode bir artmalı).
- İsteğe bağlı: `PdfAICli/package.json` → `version` ile senkronize et.

### 6.2 Prod AAB build

```bash
cd PdfAICli
export PDFAI_RELEASE_STORE_PASSWORD="keystore_şifreniz"
export PDFAI_RELEASE_KEY_PASSWORD="key_şifreniz"
npm run release:android
```

Bu komut `.env`’i production yapar ve `bundleRelease` çalıştırır.  
Çıktı: `PdfAICli/android/app/build/outputs/bundle/release/app-release.aab`

### 6.3 Play Console’da yükleme

1. [Google Play Console](https://play.google.com/console) → Uygulamanızı seçin.
2. **Yayınlama** → **Test etme** → **Dahili test**.
3. **Yeni sürüm oluştur** → **Uygulama paketlerini yükle** → `app-release.aab` dosyasını seçin.
4. Sürüm notları ekleyin (örn. "1.0.7 – Production release") → **Kaydet**.
5. **İncelemeye gönder** / **Yayınla** ile dahili test sürümünü yayınlayın.

### 6.4 Yayın sonrası (zorunlu)

- **mock/data/releases.json**: Yeni sürümü en başa ekleyin (versionCode, versionName, releasedAt, branch, track, note). Detay: **mock/docs/playstore/RELEASES.md**.

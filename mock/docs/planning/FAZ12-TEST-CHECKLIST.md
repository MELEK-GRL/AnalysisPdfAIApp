# Faz 12 – Yayın Öncesi Test Kontrol Listesi (Sprint 12.4)

Canlıya çıkmadan önce release build ve production ortamında aşağıdaki adımları tamamlayın.

---

## 1. Release build

- [ ] **Keystore ve şifreler** ayarlandı (ortam değişkenleri: `PDFAI_RELEASE_STORE_PASSWORD`, `PDFAI_RELEASE_KEY_PASSWORD`). Bkz. `mock/docs/planning/FAZ12-RELEASE.md`
- [ ] **Production .env:** `yarn env:prod` çalıştırıldı; `.env` içinde `API_BASE_URL` ve `PRIVACY_POLICY_URL` canlı değerler
- [ ] **Release build başarılı:**
  ```bash
  cd PdfAICli/android
  ./gradlew assembleRelease
  # veya App Bundle: ./gradlew bundleRelease
  ```
- [ ] APK/AAB çıktı yolu kontrol edildi:
  - APK: `android/app/build/outputs/apk/release/app-release.apk`
  - AAB: `android/app/build/outputs/bundle/release/app-release.aab`

---

## 2. Backend (production)

- [ ] Backend canlıda çalışıyor (Railway / Render / vb.)
- [ ] `MONGODB_URI`, `JWT_SECRET`, `OPENAI_API_KEY` production değerleri
- [ ] `NODE_ENV=production`; rate limit (24h/2 analiz) aktif
- [ ] CORS `CLIENT_ORIGIN` uygun (gerekirse mobil için ek origin)

---

## 3. Uygulama akışı (release APK ile test)

Release APK’yı cihaza yükleyip aşağıdaki akışları test edin.

- [ ] **Giriş:** Kayıt / giriş ekranı açılıyor, giriş başarılı
- [ ] **Sözleşme:** İlk açılışta kullanıcı sözleşmesi gösteriliyor, onaylanınca devam
- [ ] **PDF yükleme:** Tahlil PDF seçiliyor ve yükleniyor
- [ ] **Analiz:** Analiz sonucu geliyor, ekranda anlaşılır şekilde görünüyor
- [ ] **Geçmiş:** Geçmiş ekranında kayıtlar listeleniyor
- [ ] **Çıkış (Logout):** Hesaptan çıkış yapılıyor
- [ ] **Dil değişimi:** Uygulama dili değiştirildiğinde metinler güncelleniyor
- [ ] **Gizlilik politikası:** Ayarlar veya ilgili yerden gizlilik politikası linki açılıyor; URL canlı ve doğru
- [ ] **Rate limit:** Günlük limit aşıldığında (ör. 3. analizde) uygun mesaj (429 / limit doldu) gösteriliyor

---

## 4. Farklı cihaz / ekran

- [ ] Küçük ekran (telefon) test edildi
- [ ] Büyük ekran veya tablet (varsa) test edildi
- [ ] Yatay/dikey geçişte çökme veya ciddi layout bozukluğu yok

---

## 5. İsteğe bağlı

- [ ] Production API HTTPS ise `AndroidManifest.xml` içinde `android:usesCleartextTraffic="false"` yapıldı (güvenlik)
- [ ] Gereksiz `console.log` / debug kodu release’de yok (mevcut yapıda `__DEV__` ile sarılı)

---

## 6. Play Store’a yükleme

- [ ] **App Bundle (AAB)** tercihen kullanıldı (`bundleRelease`)
- [ ] Play Console’da yeni sürüm olarak yüklendi
- [ ] Store listesi, veri güvenliği ve içerik derecelendirmesi tamamlandı (Sprint 12.2, 12.3)
- [ ] İnceleme için gönderildi

Tüm maddeler tamamlandığında **Faz 12** biter; Play Store incelemesi sonrası yayına alınabilir.

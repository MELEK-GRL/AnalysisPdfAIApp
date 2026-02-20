# Play Store Yayın Kontrol Listesi

> **⚠️ ERTELENDİ – SON FAZA ALINDI**
>
> Geliştirme bitmedi. Uygulama canlıya hazır değil. Bu checklist, geliştirme tamamlanınca ve canlıya almaya karar verilince uygulanacak.

**Hedef:** Yayın sırasında sorun yaşanmaması. Tüm maddeler yayın öncesi tamamlanacak.

**Not:** Uygulama iOS ve Android için geliştirilir. Play Store (Android) ve App Store (iOS) yayını için her iki platform da hedeflenir.

---

## Teknik (Red / Build Hatası Önleme)

- [ ] Android release build başarılı (`./gradlew assembleRelease`)
- [ ] iOS release build başarılı
- [ ] **Release signing** (debug keystore değil, production keystore)
- [ ] versionCode her yayında artırılacak
- [ ] versionName güncel
- [ ] targetSdkVersion güncel (Play Store gereksinimleri)
- [ ] Hosting alındı, backend deploy edildi
- [ ] API_BASE_URL production ortamına alındı (hosting URL)
- [ ] .env production için ayarlandı (API key, MongoDB URI)
- [ ] express-rate-limit production'da aktif
- [ ] Uygulama açılışta crash/ANR yok
- [ ] Gereksiz console.log / debug kodu kaldırıldı

---

## Store Listesi (Red / İnceleme Gecikmesi Önleme)

- [ ] Uygulama adı – tıbbi iddia içermiyor
- [ ] Kısa açıklama (max 80 karakter) – "bilgilendirme amaçlı" vurgusu
- [ ] Uzun açıklama (max 4000 karakter)
- [ ] Uygulama ikonu 512x512
- [ ] Feature graphic 1024x500 (Android)
- [ ] Ekran görüntüleri: Android min 2, farklı cihaz boyutları
- [ ] Açıklama ile uygulamanın gerçek işlevi uyumlu (yanıltıcı değil)

---

## Yasal ve Politik (Red Nedeni – Zorunlu)

- [ ] **Gizlilik politikası URL** – erişilebilir, güncel, sağlık verisi ve OpenAI aktarımı açıklanmış
- [ ] **Veri güvenliği formu** (Play Console) – sağlık verisi toplandığı beyan edilecek
- [ ] **İçerik derecelendirmesi** tamamlandı *(beklemeye alındı)*
- [ ] **Veri toplama beyanı** – analytics, sağlık verisi, üçüncü taraf (OpenAI)
- [ ] Store metinlerinde tıbbi tanı/teşhis/tedavi iddiası yok
- [ ] Uygulama içinde "tıbbi tavsiye değildir" uyarısı mevcut

---

## İzinler (Minimal – Gereksiz İzin Red Nedeni)

- [ ] Sadece gerekli izinler isteniyor (INTERNET, storage vb.)
- [ ] Her izin için kullanım gerekçesi net

---

## Test (Yayın Öncesi)

- [ ] Login → Sözleşme → PDF yükle → Analiz → Geçmiş akışı çalışıyor
- [ ] Rate limit: 3. analizde 429 dönüyor
- [ ] Çıkış (Logout) çalışıyor
- [ ] Dil değiştirme çalışıyor
- [ ] Farklı ekran boyutlarında test

---

---

## Kalan İşler *(Son faz – geliştirme bitince)*

1. [ ] **Gizlilik politikası**: mock/PRIVACY_POLICY.md → GitHub Pages / hosting → `appUrls.ts` / .env PRIVACY_POLICY_URL güncelle
2. [ ] **Release signing**: Production keystore oluştur → `android/app/build.gradle`'de `signingConfigs.release` tanımla (şu an release de debug keystore kullanıyor)
3. [ ] **API_BASE_URL**: `.env` içinde production URL ayarla
4. [ ] **targetSdkVersion**: 2025 Play Store gereksinimi için 35’e çıkar (android/build.gradle), test et
5. [ ] **Release build**: `./gradlew assembleRelease` veya `bundleRelease` ile test et
6. [ ] **Store listesi**: İsim, açıklama, ikon 512x512, feature graphic, ekran görüntüleri
7. [ ] **Play Console**: Veri güvenliği formu + içerik derecelendirmesi

Detaylı adımlar: **mock/PLAYSTORE_GELISTIRMELER.md**

---

## Yayın Sonrası

- [ ] Canlı ortamda API erişilebilir
- [ ] MongoDB Atlas production ayarları
- [ ] İlk kullanıcı geri bildirimleri takip

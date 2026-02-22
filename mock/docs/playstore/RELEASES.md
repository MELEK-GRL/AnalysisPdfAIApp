# Sürüm kaydı (zorunlu)

**Kural:** Her yeni sürüm (dahili test, kapalı test veya üretim) çıktığında `mock/data/releases.json` güncellenir. Bu adım **zorunludur**.

## Ne yapılacak?

Sürümü Play Console’a yükleyip yayınladıktan sonra:

1. `mock/data/releases.json` dosyasını aç.
2. `releases` dizisinin **en başına** aşağıdaki formatta yeni bir nesne ekle:

```json
{
  "versionCode": 5,
  "versionName": "1.0.4",
  "releasedAt": "2026-02-23T14:00:00+03:00",
  "branch": "dev",
  "track": "Dahili test",
  "note": "Sürüm çıkıldı"
}
```

3. Alanlar:
   - **versionCode / versionName:** `build.gradle` ile aynı.
   - **releasedAt:** Yayın tarihi/saati (ISO 8601, tercihen GMT+3).
   - **branch:** Hangi branch’ten build alındı (`dev`, `uat`, `main`).
   - **track:** Play Store track (`Dahili test`, `Kapalı test`, `Üretim`).
   - **note:** İsteğe bağlı kısa not (örn. "Sürüm çıkıldı", "Production release").

## Neden zorunlu?

- Hangi sürümün ne zaman, hangi branch ve track’ten çıktığı tek yerde takip edilir.
- Geçmiş sürümler ve production sürümleri kolayca görülür.
- Kontrol listesi: **mock/docs/playstore/PLAYSTORE_CHECKLIST.md** → “Yayın sonrası” → “Sürüm kaydı (zorunlu)”.

# Dev / UAT / Prod – Sürüm testlerini ayrı ayrı yapma

---

## Önce bunu bil (basit anlatım)

Uygulama **tek bir sunucu adresi** bilir; o adres build alırken `.env` dosyasından yazılır. Yani:

- **3 farklı .env** var: dev, uat, prod. Her birinde farklı `API_BASE_URL` (sunucu adresi) yazar.
- **Hangi .env ile build alırsan** uygulama **sadece o sunucuya** istek atar. Sonradan değiştiremezsin; build zamanında belli olur.

**Ne yapıyorsun özetle:**

| Ne yapmak istiyorsun? | Ne yapıyorsun? |
|----------------------|----------------|
| **Bilgisayarda geliştirip test etmek** (limit yok) | `yarn env:dev` yap → bilgisayarda backend’i çalıştır → `yarn start` + `yarn android` ile uygulamayı aç. Play Store’a hiçbir şey yüklemiyorsun. |
| **UAT sunucusuna bağlı sürüm test etmek** | `yarn env:uat` yap → release build al → bu AAB’yi ister Play dahili teste at, ister APK olarak yükle. Bu sürüm **sadece UAT sunucusuna** gider. |
| **Canlı (production) sunucusuna bağlı sürüm test etmek** | `yarn env:prod` yap → release build al → AAB’yi Play’e yükle. Bu sürüm **sadece production sunucusuna** gider. |

**Önemli:** Aynı uygulama kodundan **üç ayrı build** alabilirsin: biri dev .env ile (lokal), biri uat .env ile (UAT sunucusu), biri prod .env ile (canlı sunucu). Hangisini yüklersen o sunucuya bağlanır; karışmaz.

---

## Detaylı adımlar (yukarıdakileri anladıysan)

Her ortamı ayrı test etmek için: **hangi .env ile build aldığınız** o sürümün hangi backend’e gideceğini belirler. Bir build tek bir ortama bağlıdır.

---

## 1. DEV testi

**Amaç:** Lokal backend ile sınırsız analiz, hızlı geliştirme.

| Ne yapılır | Komut / adım |
|------------|----------------|
| .env | `yarn env:dev` veya `cp env-examples/env.development .env` |
| Backend | Bilgisayarda `PdfAIServer` çalışır; `APP_ENV=dev` (veya boş) → **günlük limit yok** |
| Çalıştırma | `yarn start` + `yarn android` (veya iOS). Emülatör veya aynı ağdaki cihaz |
| Build | Gerekmez; debug ile yeter. Play Store’a yüklemeden dev testi yapılır |

**Not:** Fiziksel cihazda test için bilgisayarın IP’sini `env.development` içinde `API_BASE_URL=http://BILGISAYAR_IP:4000` yapın; cihaz ve bilgisayar aynı Wi‑Fi’de olmalı.

---

## 2. UAT testi

**Amaç:** Canlıya almadan önce “staging” backend ile deneme (limit prod gibi 2/24h).

| Ne yapılır | Komut / adım |
|------------|----------------|
| .env | `yarn env:uat` veya `cp env-examples/env.uat .env` |
| Backend | UAT sunucusu ayakta olmalı (örn. `https://pdfai-uat.onrender.com`). `env.uat` içindeki `API_BASE_URL` buna işaret etmeli |
| Build | Release AAB: `cd android && ./gradlew clean bundleRelease` (keystore şifreleri set) |
| Dağıtım | AAB’yi dahili teste yükleyebilir veya APK ile sideload dağıtabilirsiniz |
| versionCode | Play’e yüklüyorsanız önceki sürümden büyük olmalı |

UAT build’i **sadece UAT backend’e** gider; prod’u etkilemez.

---

## 3. PROD testi

**Amaç:** Canlı backend ile aynı sürümü test etmek (dahili test / kapalı test).

| Ne yapılır | Komut / adım |
|------------|----------------|
| .env | `yarn env:prod` veya `cp env-examples/env.production .env` |
| Backend | Production URL (örn. Railway). Limit 2 analiz / 24 saat |
| Build | `cd android && ./gradlew clean bundleRelease` |
| Dağıtım | Play Console → Dahili test (veya Kapalı test) → Yeni sürüm oluştur → AAB yükle |
| versionCode | Her yeni yüklemede artırın |
| Sürüm kaydı | `mock/data/releases.json` güncelle (zorunlu). Bkz. `RELEASES.md` |

Prod build’i **sadece production backend’e** gider.

---

## Özet tablo

| Ortam | .env | Backend | Günlük limit | Nasıl test |
|--------|------|---------|--------------|------------|
| **DEV** | env.development | Lokal (localhost / 10.0.2.2 / bilgisayar IP) | Yok | `yarn start` + `yarn android`, emülatör/cihaz |
| **UAT** | env.uat | UAT URL | 2/24h | Release build → dahili test veya sideload |
| **PROD** | env.production | Production URL | 2/24h | Release build → Play dahili/kapalı/üretim |

---

## Pratik sıra (sürüm çıktıkça)

1. **Dev’de geliştir** → `yarn env:dev`, backend lokal, `yarn start` + `yarn android` ile test.
2. **UAT’e al** → `yarn env:uat`, UAT backend deploy, versionCode artır, release build al → dahili test veya sideload ile dağıt, test et.
3. **Prod’a al** → `yarn env:prod`, versionCode artır, release build al → Play’e yükle (dahili → kapalı → üretim).  
4. Her **çıkan sürüm** için `mock/data/releases.json` güncelle.

Böylece dev, uat ve prod testlerini ayrı ayrı yapmış olursunuz; karışıklık olmaz çünkü her build tek bir backend’e bağlıdır.

# Dev / UAT / Prod Ortam Kurulumu

## Genel Bakış

| Ortam | Git dalı | Backend URL | MongoDB | Rate limit (24h/2) | Amaç |
|-------|----------|-------------|---------|-------------------|------|
| **Dev** | `dev` | localhost / local IP | Local veya Atlas (test) | **Kapalı** (sınırsız test) | Geliştirme, debug |
| **UAT** | `uat` | Hosting URL (staging) | Atlas (ayrı DB veya cluster) | **Açık** | Kabul testi |
| **Prod** | `main` | Hosting URL (production) | Atlas (production) | **Açık** | Canlı kullanıcılar |

---

## Nasıl Kurulur?

### 1. Git Dalları

```bash
# Mevcut main'den dev dalı
git checkout -b dev

# UAT dalı
git checkout -b uat
git checkout main
```

**Akış:**
- `dev` → günlük geliştirme
- `uat` → dev'den merge, test sonrası main'e merge
- `main` → sadece uat’ten merge, canlı ortam

---

### 2. Backend (PdfAIServer)

**Dosya yapısı:**
- `PdfAIServer/.env` → gitignore'da (asla commit etme)
- `PdfAIServer/.env.example` → şablon (commit edilir)

**`.env.example` örneği:**
```
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret
OPENAI_API_KEY=sk-...
DB_NAME=pdfai_dev
```

**Ortamlara göre değişenler:**

| Değişken | Dev | UAT | Prod |
|----------|-----|-----|------|
| NODE_ENV | development | production | production |
| MONGODB_URI | Test cluster veya local | Ayrı Atlas DB | Production Atlas |
| DB_NAME | pdfai_dev | pdfai_uat | pdfai_prod |
| OPENAI_API_KEY | Test / geliştirme key | Staging key | Production key |

**Rate limit (24 saatte 2 analiz):**
- **Dev** (`NODE_ENV=development`): Limit **devre dışı** – sınırsız test
- **UAT / Prod**: Limit **aktif**

**Hosting (Render / Railway vb.):**
- UAT servisi: `pdfai-uat.onrender.com`
- Prod servisi: `pdfai-prod.onrender.com` veya özel domain
- Her serviste ortam değişkenleri ayrı tanımlanır.

---

### 3. Mobil (PdfAICli)

**Mevcut:** `react-native-dotenv` ile `.env` → `API_BASE_URL`

**Seçenekler:**

#### Seçenek A – Manuel (En basit)
- `.env.development`, `.env.uat`, `.env.production` oluştur (gitignore'da)
- İhtiyaca göre: `cp .env.development .env` veya `cp .env.uat .env`
- `yarn start` veya build almadan önce doğru .env seç

#### Seçenek B – NPM script ✓ (Uygulandı)
`PdfAICli/package.json`:
```json
"env:dev": "cp env-examples/env.development .env",
"env:uat": "cp env-examples/env.uat .env",
"env:prod": "cp env-examples/env.production .env"
```
Kullanım: `yarn env:dev && yarn start` (veya env:uat / env:prod)

#### Seçenek C – Build ortamına göre (ileri seviye)
- `babel.config.js`: `path` değerini `process.env.APP_ENV` ile seç
- veya `react-native-config` ile native build’e env enjekte et

**`env-examples/` dosyaları (commit edilir):**
- `env.development`: `API_BASE_URL=http://10.0.2.2:4000` (Android emulator) veya `http://192.168.x.x:4000` (fiziksel cihaz)
- `env.uat`: `API_BASE_URL=https://pdfai-uat.onrender.com`
- `env.production`: `API_BASE_URL=https://pdfai-prod.onrender.com`

Özel URL kullanacaksanız bu dosyaları düzenleyin veya `yarn env:dev` sonrası `.env` içinde değiştirin.

---

## Ortam Geçiş Checklist

- [ ] Git dalını doğru seç (`dev` / `uat` / `main`)
- [ ] Backend: Doğru `.env` veya hosting env değişkenleri (dev için `NODE_ENV=development`)
- [ ] Mobil: `yarn env:dev` / `yarn env:uat` / `yarn env:prod` ile `.env` güncelle
- [ ] Metro cache temizle (gerekirse): `yarn start --reset-cache`

---

## Hızlı Başlangıç (Dev Ortamı)

**Backend:**
```bash
cd PdfAIServer
# .env içinde NODE_ENV=development olmalı (rate limit kapalı)
yarn start
```

**Mobil:**
```bash
cd PdfAICli
yarn env:dev
yarn start
# Başka terminalde:
yarn android   # veya yarn ios
```

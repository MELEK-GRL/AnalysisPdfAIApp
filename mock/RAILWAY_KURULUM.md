# Railway’de Backend (PdfAIServer) Nasıl Kullanılır?

Bu rehber, PdfAIServer’ı **Railway** üzerinde yayına almak için adım adım yapılacakları anlatır. Veritabanı için **MongoDB Atlas** kullanıyorsun (Railway’de MongoDB da açabilirsin; bu rehber Atlas ile devam ediyor).

---

## Ön koşullar

- **GitHub** hesabı (proje repoda olmalı)
- **MongoDB Atlas** hesabı ve cluster (MONGODB_URI connection string)
- **OpenAI** API key (PDF analizi için)
- **Railway** hesabı: https://railway.app → “Login” → GitHub ile giriş

---

## Adım 1 – Railway’e giriş ve yeni proje

1. **https://railway.app** adresine git.
2. **Login** → **GitHub** ile giriş yap (yetki ver).
3. **Dashboard**’da **“New Project”** (Yeni Proje) tıkla.
4. **“Deploy from GitHub repo”** seç.
5. Repoyu seç: **PdfAIAppProje** (veya projenin adı). Yetki vermemişse “Configure GitHub” ile erişim ver.
6. Repo seçildikten sonra Railway bir **service** oluşturur. Şimdilik **root directory** ayarı gerekebilir (proje ana klasörde değilse).

---

## Adım 2 – Root directory (proje tek klasördeyse)

Proje yapın **PdfAIAppProje** ana klasör ve içinde **PdfAIServer** varsa:

1. Oluşan **service**’e (örn. PdfAIServer) tıkla.
2. **Settings** (Ayarlar) sekmesine gir.
3. **Root Directory** alanını bul.
4. **`PdfAIServer`** yaz (Railway’in build ve start’ı bu klasörden yapması için).
5. Kaydet.

(Eğer repo sadece PdfAIServer ise bu adımı atla.)

---

## Adım 3 – Ortam değişkenleri (Variables)

Aynı service’te **Variables** sekmesine gir. Aşağıdakileri ekle:

| Değişken | Değer | Açıklama |
|----------|------|----------|
| `NODE_ENV` | `production` | Production modu |
| `PORT` | (boş bırak) | Railway otomatik atar; kod zaten `process.env.PORT` kullanıyor |
| `MONGODB_URI` | `mongodb+srv://...` | Atlas’taki connection string (Replace password ile şifreyi yaz) |
| `JWT_SECRET` | En az 16 karakter rastgele string | Token imzası için; güçlü bir şifre üret |
| `OPENAI_API_KEY` | `sk-...` | platform.openai.com’dan aldığın API key |

İsteğe bağlı:

- `DB_NAME` = `analysispdf` (zaten constants’ta varsayılan var)
- `CLIENT_ORIGIN` = Mobil uygulamanın erişeceği origin (CORS için; gerekirse sonra ekle)

**Save** / **Deploy** ile değişiklikler yeni deploy’u tetikler.

---

## Adım 4 – Domain / public URL

1. Service’te **Settings** → **Networking** bölümüne bak.
2. **Generate Domain** veya **Public Networking** ile dışarıya URL ver.
3. Railway bir adres verir: örn. `pdfaiserver-production-xxxx.up.railway.app`.
4. Bu URL = **API adresin**. Mobil uygulamada `API_BASE_URL` buna ayarlanacak (https ile başlar).

---

## Adım 5 – Deploy ve kontrol

1. **Deploy** otomatik başlar (veya “Deploy” butonuna bas).
2. **Deployments** sekmesinden log’lara bak: “MongoDB connected”, “Server listening on port …” görmelisin.
3. Tarayıcıda test: `https://SENIN-RAILWAY-URL.up.railway.app/health`  
   Yanıt: `{"ok":true,"ts":...}` olmalı.

Hata alırsan log’da **MONGODB_URI** veya **JWT_SECRET** eksik/hatalı uyarısı çıkabilir; Variables’ı kontrol et.

---

## Adım 6 – Mobil uygulamada API adresi

PdfAICli’de (React Native) production veya test için:

- **.env** veya **env.production** içinde:
  ```env
  API_BASE_URL=https://SENIN-RAILWAY-URL.up.railway.app
  ```
- Port yazmana gerek yok; Railway HTTPS ile 443’te sunar, URL yeterli.

---

## Özet

| Ne yaptın? | Nerede? |
|------------|---------|
| Railway’de proje açtın | New Project → Deploy from GitHub repo |
| Backend klasörünü gösterdin | Settings → Root Directory: `PdfAIServer` |
| Env değişkenlerini girdin | Variables: NODE_ENV, MONGODB_URI, JWT_SECRET, OPENAI_API_KEY |
| Dışarıya URL verdin | Settings → Generate Domain |
| Mobil uygulamayı bağladın | API_BASE_URL = Railway URL |

---

## Notlar

- **MongoDB:** Bu rehberde Atlas kullandık. İstersen Railway’de “Add MongoDB” ile servis ekleyip `MONGODB_URI`’yi Railway’in verdiği connection string yapabilirsin (ayrı ücret/kredi tüketir).
- **Ücret:** Railway aylık ücretsiz kredi verir; kredi bitince durur veya karttan çeker. Küçük bir API için aylık birkaç dolar civarı olabilir.
- **Güncelleme:** GitHub’a push = Railway yeni deploy başlatır (otomatik deploy açıksa).

Bu adımlarla Railway’i kullanarak backend’i yayına almış olursun.

---

## Build failed – Sorun giderme

**"Build failed now"** görüyorsan sırayla şunları kontrol et:

### 1. Root Directory
- **Settings** → **Source** veya **Build** bölümünde **Root Directory** (Root Directory / Watch Paths) var mı bak.
- **`PdfAIServer`** yazılı olmalı (repo kökü PdfAIAppProje ise). Yoksa Railway repo kökünden build eder; orada backend yok, build düşer.
- Değiştirdikten sonra **Redeploy** veya **Deploy** tetikle.

### 2. Build log’una bak
- **Deployments** sekmesinde son (failed) deploy’a tıkla.
- **View Logs** / **Build logs** ile hatayı oku. Örnek:
  - `package.json not found` → Root Directory yanlış veya eksik.
  - `yarn not found` / `node-gyp` / `python` → Build ortamı; aşağıdaki **Build Command** deneyebilirsin.
  - `Cannot find module` → Bağımlılık eksik; `npm install` / `yarn install` başarısız olmuş olabilir.

### 3. Build / Start komutları (gerekirse)
- **Settings** → **Build**:
  - **Build Command:** Boş bırak (Railway otomatik `yarn install` veya `npm install` yapar) veya `npm install` dene (yarn hata veriyorsa).
  - **Start Command:** `node src/index.js` veya `npm start` (zaten package.json’da var).
- **Settings** → **Build** bölümünde **Nixpacks** kullanılıyorsa Node sürümü için:
  - **Variables**’a `NIXPACKS_NODE_VERSION=20` ekleyebilirsin.

### 4. Yeniden deploy
- Root Directory ve (varsa) Build/Start komutlarını kaydettikten sonra **Deployments** → **Redeploy** veya **Deploy** ile tekrar dene.

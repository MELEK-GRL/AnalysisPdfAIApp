# AnalysisPdfAIApp

AnalysisPdfAIApp, laboratuvar / tahlil PDF dosyalarını yükleyip, OpenAI desteğiyle analiz eden bir mobil uygulama ve Node.js backend projesidir.

Bu projede amacım:
- Doktor randevusuna gitmeden önce sonuçlara hızlı bir ön bakış yapmak
- Karmaşık PDF tahlil sonuçlarını daha okunaklı ve anlaşılır hale getirmek
- React Native + Node.js + MongoDB + OpenAI entegrasyonunu uçtan uca gösterebileceğim bir portföy projesi oluşturmak

---

## Özellikler

- Mobil uygulama üzerinden PDF tahlil dosyası yükleme
- Backend tarafında:
  - PDF metni çıkarma
  - OpenAI ile tahlil sonuçlarını yorumlama
- Kullanıcıya:
  - Referans aralıkları
  - Düşük / normal / yüksek değer mantığı
  - Basit ve anlaşılır açıklamalar sunma
- JWT tabanlı auth (kullanıcı giriş/kayıt yapısı için altyapı)
- Güvenlik için:
  - Rate limiting
  - Helmet
  - CORS ayarları

---

## Kullanılan Teknolojiler

### Mobil Uygulama – `PdfAICli` (React Native)

- React Native 0.74.5 (CLI)
- TypeScript
- React Navigation (`@react-navigation/native`, `@react-navigation/native-stack`)
- State management: `zustand`
- İstekler: `axios`
- Depolama: `@react-native-async-storage/async-storage`
- Dosya seçme: `react-native-document-picker`
- Animasyon: `lottie-react-native`
- UI yardımcıları:
  - `react-native-vector-icons`
  - `react-native-linear-gradient`
  - `react-native-safe-area-context`
  - `react-native-screens`
- Config & kalite:
  - `react-native-dotenv`
  - ESLint, Prettier, Jest

### Backend – `PdfAIServer` (Node.js / Express)

- Node.js 18+
- Express 5
- MongoDB + Mongoose
- Kimlik doğrulama:
  - `jsonwebtoken` (JWT)
  - `bcryptjs` (şifre hash)
- PDF & dosya işlemleri:
  - `multer` (dosya upload)
  - `pdf-parse` (PDF’ten metin çıkarma)
- OpenAI entegrasyonu: `openai` (Node SDK)
- Güvenlik & yapı:
  - `dotenv`
  - `helmet`
  - `cors`
  - `express-rate-limit`
- Geliştirme: `nodemon`

---

## Proje Yapısı

```text
AnalysisPdfAIApp/
  PdfAICli/       # React Native mobil uygulama
  PdfAIServer/    # Node.js + Express backend
  .gitignore



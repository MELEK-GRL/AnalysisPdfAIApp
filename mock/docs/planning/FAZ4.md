# Faz 4 – Backend + Mobil Testler

## Yapılanlar

### Backend (PdfAIServer)

1. **`src/app.js`** – Express uygulaması `index.js`'ten ayrıldı (test edilebilirlik için).
2. **`src/index.js`** – Sadece Mongo bağlantısı ve `app.listen` yapıyor.
3. **Test altyapısı:**
   - `jest.config.js` – Jest config
   - `__tests__/setup.js` – MongoDB Memory Server, test env vars
   - `__tests__/health.test.js` – `/health`, `/__early`, 404
   - `__tests__/auth.test.js` – register, login, /me
   - `__tests__/labs.test.js` – history, history/:id, latest
   - `__tests__/analytics.test.js` – POST eventType validation

4. **package.json** – `jest`, `supertest`, `mongodb-memory-server` devDependencies eklendi.

**Backend testlerini çalıştırmak için:**
```bash
cd PdfAIServer
yarn install   # ilk kez: jest, supertest, mongodb-memory-server
yarn test
```

**Not:** `PdfAIServer/.yarnrc.yml` içinde `enableImmutableInstalls: false` ayarlı. Yarn lockfile güncellemesi gerekirse bu sayede izin verir.

---

### Mobil (PdfAICli)

1. **`jest.setup.js`** – AsyncStorage, document-picker, useDeviceStore mock'ları
2. **`jest.config.js`** – setupFilesAfterEnv, transformIgnorePatterns (react-navigation için)
3. **`__tests__/App.test.tsx`** – App smoke test (mock ile)
4. **`__tests__/Button.test.tsx`** – Button bileşen testleri (3 test)

**Mobil testleri çalıştırmak için:**
```bash
cd PdfAICli
yarn test
# Watchman sorunu için: CI=1 yarn test --no-watch --watchman=false
```

---

## Özet

| Alan      | Dosya sayısı | Test sayısı |
|----------|--------------|-------------|
| Backend  | 5 test dosyası | ~20+ test |
| Mobil    | 2 test dosyası | 4 test     |

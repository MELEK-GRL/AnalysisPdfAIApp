# Network Error Çözümü – Emülatör → Backend

Hata: `CONSENT ERR: Network Error` veya `ERR_NETWORK` → Uygulama backend’e bağlanamıyor.

---

## 1. Backend Çalışıyor mu?

**Önce backend’i başlatın.** Emülatör ve Metro’dan önce çalışmalı.

```bash
cd PdfAIServer
yarn start
```

`✅ MongoDB connected` ve `🚀 Server listening on port 4000` görünmeli.

**Test:** Aynı makinede yeni terminal açıp:

```bash
curl http://localhost:4000/health
```

`{"ok":true,"ts":...}` dönüyorsa backend çalışıyor.

---

## 2. Doğru Sıra: 3 Terminal

| Sıra | Terminal | Komut |
|------|----------|-------|
| 1 | Backend | `cd PdfAIServer && yarn start` |
| 2 | Metro | `cd PdfAICli && yarn start` |
| 3 | Android | `cd PdfAICli && yarn android` |

Backend **her zaman açık** olmalı. Kapatırsanız Network Error alırsınız.

---

## 3. API_BASE_URL (PdfAICli/.env)

Android emülatörde `10.0.2.2` = bilgisayarınızın localhost’u.

Mevcut ayar:
```
API_BASE_URL=http://10.0.2.2:4000
```

Bu genelde doğrudur. Değiştirmeyin.

---

## 4. 10.0.2.2 Çalışmıyorsa: Makinenin IP’sini Kullanın

Bazı ortamlarda `10.0.2.2` erişilemiyor olabilir. Mac’inizin yerel IP’sini kullanmayı deneyin:

```bash
# Mac'te IP bulun
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Örn. `192.168.1.42` çıkarsa, `PdfAICli/.env` içinde:

```
API_BASE_URL=http://192.168.1.42:4000
```

Kaydedin, Metro’yu yeniden başlatın (`yarn start`), uygulamayı da yeniden çalıştırın.

---

## 5. Özet Kontrol Listesi

- [ ] Backend çalışıyor (`yarn start` PdfAIServer’da)
- [ ] `curl http://localhost:4000/health` yanıt veriyor
- [ ] MongoDB bağlı (Atlas Resume + IP eklenmiş)
- [ ] Metro çalışıyor
- [ ] `.env` içinde `API_BASE_URL=http://10.0.2.2:4000` (veya Mac IP’niz)

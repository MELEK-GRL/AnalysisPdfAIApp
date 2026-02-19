# Backend (PdfAIServer) Sorun Giderme

## MongoDB Atlas: querySrv ENOTFOUND

Hata: `querySrv ENOTFOUND _mongodb._tcp.analysispdfcluster.aoswh7f.mongodb.net`

Bu hata MongoDB Atlas (cloud) SRV bağlantı dizesi ile DNS sorgusunun başarısız olduğunu gösterir. Lokal MongoDB kullanılmıyorsa, aşağıdaki Atlas odaklı çözümleri uygulayın.

### Olası Nedenler

- İnternet bağlantısı yok veya zayıf
- MongoDB Atlas cluster duraklatılmış veya silinmiş
- Firewall / DNS SRV kayıtlarını engelliyor
- Bağlantı dizesinde yazım hatası

### Çözümler

#### 1. MongoDB Atlas Kontrolü (Öncelikli)

1. [MongoDB Atlas](https://cloud.mongodb.com) hesabına girin
2. Cluster **Running** olmalı (Paused ise **Resume**)
3. **Network Access** → IP adresiniz ekli mi? (geliştirme için `0.0.0.0/0` tüm IP'lere izin verir)
4. **Database Access** → kullanıcı var mı, şifre doğru mu?
5. Cluster’a **Connect** → **Drivers** (Node.js) → **yeni** connection string kopyalayın (eski cluster silinmiş olabilir)

#### 2. SRV Yerine Standart Connection String

SRV formatı DNS sorunlarına daha hassas olabilir. Atlas'tan **"Connect your application"** seçip **"Drivers"** sekmesinde "Connection string only" ile standart format alın:

```
mongodb+srv://KULLANICI:SIFRE@cluster.xxxxx.mongodb.net/analysispdf?retryWrites=true&w=majority
```

Şifrede `@`, `#`, `%` gibi karakterler varsa [URL encode](https://www.w3schools.com/tags/ref_urlencode.asp) edin.

#### 3. DNS / Ağ Kontrolü

- Farklı ağ (ör. mobil hotspot) ile deneyin
- VPN kullanıyorsanız kapatıp tekrar deneyin
- `nslookup _mongodb._tcp.CLUSTER_ADI.mongodb.net` ile DNS cevabını test edin

#### 4. Geçici: Mongo Olmadan Başlatma

Backend, Mongo bağlantısı olmadan da ayağa kalkar ancak auth, upload, labs çalışmaz. Sadece API’nin ayakta olduğunu test etmek için:

`.env` içinde `MONGODB_URI` satırını boş bırakın veya yorum satırı yapın:
```
# MONGODB_URI=...
```

Ardından `yarn start`. Uyarı: `⚠️ MONGODB_URI yok, Mongo atlanıyor.` göreceksiniz; bu durumda sadece `/health` vb. basit endpoint’ler çalışır.

---

## Diğer Hatalar

| Hata | Çözüm |
|------|-------|
| `OPENAI_API_KEY missing` | `.env` içine `OPENAI_API_KEY=sk-...` ekleyin |
| `Port 4000 already in use` | Başka bir port kullanın: `PORT=4001 yarn start` |
| `EADDRINUSE` | 4000 portunu kullanan işlemi kapatın: `lsof -i :4000` |

---

## Bağlantı Testi

```bash
cd PdfAIServer
yarn start
```

Başarılı bağlantıda: `✅ MongoDB connected` ve `🚀 Server listening on port 4000` görünmeli.

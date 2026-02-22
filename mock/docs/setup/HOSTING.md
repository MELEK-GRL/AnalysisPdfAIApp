# Hosting ve Domain Gereksinimleri

## Durum

**Şimdilik:** Local geliştirme (backend localhost, MongoDB Atlas free). Hosting yayın öncesi alınacak.

---

## Özet

| Bileşen | İhtiyaç | Mevcut / Öneri |
|---------|---------|-----------------|
| **MongoDB** | Cloud DB | Atlas free tier – değişiklik yok |
| **Backend (Node.js API)** | Hosting gerekli | Render, Railway, Fly.io vb. |
| **Domain** | İsteğe bağlı | Hosting’in verdiği subdomain yeterli |

---

## Neden Hosting Gerekli?

Uygulama Play Store’da yayında olunca kullanıcılar API’ye bağlanacak. Backend localhost’ta çalışamaz; internete açık bir sunucuda çalışmalı.

---

## MongoDB Atlas (Free)

- **Değişiklik yok** – free tier ile devam edebilirsiniz
- Cluster Resume, IP whitelist düzenli kontrol edilmeli
- Production’da aynı cluster kullanılabilir (traffic limiti free tier sınırları içinde)

---

## Backend Hosting Seçenekleri

### Ücretsiz / Düşük maliyet

| Servis | Ücretsiz | Not |
|--------|----------|-----|
| **Render** | Free tier | Uyku modu (cold start ~30 sn) |
| **Railway** | Aylık kredi | $5 kredi, sonrası kullanım bazlı |
| **Fly.io** | Free allowance | Bölgeye göre sınırlı |
| **Cyclic** | Free | Node.js odaklı |

### Ücretli (daha stabil)

| Servis | Aylık |
|--------|-------|
| Render Starter | ~$7 |
| Railway | Kullanım bazlı |
| DigitalOcean Droplet | ~$4–6 |
| Hetzner VPS | ~€4 |

---

## Domain

**Zorunlu değil.** Çoğu hosting ücretsiz subdomain verir:
- `yourapp.onrender.com`
- `yourapp.railway.app`
- `yourapp.fly.dev`

**Özel domain** (örn. `api.tahlilanaliz.com`) isterseniz:
- Namecheap, GoDaddy, Cloudflare vb. ~$10–15/yıl
- Hosting’e CNAME ile bağlanır

---

## Production .env

Hosting’e deploy sonrası:
- `MONGODB_URI` – Atlas connection string (aynı veya ayrı cluster)
- `OPENAI_API_KEY` – Production key
- `API_BASE_URL` – Mobil uygulamada: `https://yourapp.onrender.com` (hosting URL’niz)
- `PORT` – Hosting’in verdiği port (genelde otomatik)

---

## Play Store ile İlişki

- Uygulama içindeki `API_BASE_URL` production backend adresi olmalı
- Gizlilik politikası için: GitHub Pages, Notion veya hosting’te statik sayfa – **URL gerekli**
- Domain olmadan da Gizlilik politikası barındırılabilir (örn. `https://username.github.io/privacy`)

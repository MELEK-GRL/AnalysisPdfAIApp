# Oracle Cloud Free Tier – Backend + MongoDB Tek VM Kurulumu

> **⚠️ Kullanılmıyor.** Bu yol iptal edildi. Proje için **Render (backend) + MongoDB Atlas (veritabanı)** kullanılacak. Bu dosya yalnızca ileride Oracle denemek isteyenler için referans olarak bırakıldı.

Bu rehber, PdfAI uygulamasını **tek bir Oracle Cloud VM** üzerinde 24 saat çalıştırmak için adım adım yapılacakları anlatır. Maliyet: 0 ₺ (Always Free limitleri içinde).

---

## Ön koşullar

- Oracle Cloud hesabı (kredi kartı gerekir; Always Free kaynaklarda ücret kesilmez)
- Bilgisayarında SSH (Mac/Linux’ta var; Windows’ta OpenSSH veya PuTTY)
- Proje GitHub’da veya elinde PdfAIServer kodu

---

## Adım 1 – Oracle Cloud hesabı ve VM oluşturma

1. **https://www.oracle.com/cloud/free/** adresine git → **Start for free**.
2. Ülke, e-posta, şifre ve kredi kartı bilgisi ile kayıt ol (kart doğrulama için; Always Free’de kesinti yapılmaz).
3. Giriş yaptıktan sonra sol menüden: **Compute** → **Instances** → **Create instance**.
4. Ayarlar:
   - **Name:** `pdfai-server` (veya istediğin isim)
   - **Placement:** Varsayılan
   - **Image and shape:** **Edit** tıkla
     - **Image:** Ubuntu 22.04
     - **Shape:** **Always free-eligible** seç (ör. VM.Standard.E2.1.Micro – 1 OCPU, 1 GB RAM)
   - **Networking:** Varsayılan VCN kabul edilebilir
   - **Add SSH keys:** **Generate a key pair for me** seç → **Save Private Key** ile `.key` dosyasını indir (bir daha gösterilmez; güvenli sakla)
   - **Save Public Key** de indirip saklayabilirsin
5. **Create** ile VM oluştur. Birkaç dakika sonra **Running** olur.
6. Instance detayından **Public IP address**’i kopyala (sonra SSH ve API için kullanacaksın).

---

## Adım 2 – Güvenlik listesinde portları açma

VM’e dışarıdan erişim için port açılmalı.

1. Sol menü: **Networking** → **Virtual cloud networks** → Listeden VCN’e tıkla.
2. **Security Lists** → Varsayılan security list’e (örn. Default Security List) tıkla.
3. **Ingress Rules** → **Add Ingress Rules**.
4. İki kural ekle (gerekirse iki kez Add Ingress Rules):

   | Source CIDR | IP Protocol | Destination Port Range | Açıklama |
   |-------------|-------------|------------------------|----------|
   | 0.0.0.0/0   | TCP         | 22                     | SSH      |
   | 0.0.0.0/0   | TCP         | 4000                   | API      |

5. **Add Ingress Rules** ile kaydet.

---

## Adım 3 – VM’e SSH ile bağlanma

Bilgisayarında terminal aç. İndirdiğin `.key` dosyasının iznini düzelt (bir kez):

```bash
chmod 400 /yol/indirdigin-key.key
```

Bağlan (PUBLIC_IP yerine kendi VM public IP’ni yaz):

```bash
ssh -i /yol/indirdigin-key.key ubuntu@PUBLIC_IP
```

İlk seferde “Are you sure you want to continue connecting?” derse `yes` yaz.

Bağlandıysan sunucuda `ubuntu@...` prompt’u görürsün.

---

## Adım 4 – Sunucuyu güncelleme

```bash
sudo apt update && sudo apt upgrade -y
```

İsteğe bağlı; önerilir.

---

## Adım 5 – MongoDB kurulumu

```bash
# MongoDB paket listesini ekle
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

sudo apt update
sudo apt install -y mongodb-org

# Başlat ve açılışta otomatik başlasın
sudo systemctl start mongod
sudo systemctl enable mongod

# Kontrol
sudo systemctl status mongod
```

`active (running)` görünmeli. Varsayılan olarak `localhost:27017`’de dinler; dışarı açmıyoruz (güvenlik).

---

## Adım 6 – Node.js kurulumu (LTS)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

node -v   # v20.x.x
npm -v
```

---

## Adım 7 – Projeyi sunucuya alma

**Seçenek A – Git ile (repo varsa):**

```bash
cd ~
git clone https://github.com/KULLANICI/PdfAIAppProje.git
cd PdfAIAppProje/PdfAIServer
```

(GitHub repo URL’ini kendi reponla değiştir.)

**Seçenek B – Bilgisayarından SCP ile göndermek:**

Bilgisayarında (VM’e bağlı değilken):

```bash
scp -i /yol/indirdigin-key.key -r /Users/melek/Desktop/PdfAIAppProje/PdfAIServer ubuntu@PUBLIC_IP:~/PdfAIServer
```

Sunucuda:

```bash
cd ~/PdfAIServer
```

---

## Adım 8 – Ortam değişkenleri (.env)

Sunucuda PdfAIServer klasöründe:

```bash
nano .env
```

Şu içeriği yaz (OPENAI_API_KEY ve JWT_SECRET’ı kendin belirle):

```env
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb://localhost:27017/analysispdf
JWT_SECRET=buraya_en_az_16_karakter_uzun_rastgele_bir_string_yaz
OPENAI_API_KEY=sk-...openai_key_buraya
```

- `JWT_SECRET`: Rastgele, tahmin edilmesi zor en az 16 karakter.
- `OPENAI_API_KEY`: https://platform.openai.com/api-keys adresinden alınır.

Kaydet: `Ctrl+O`, Enter, `Ctrl+X`.

---

## Adım 9 – Bağımlılıklar ve çalıştırma testi

```bash
cd ~/PdfAIServer
# veya: cd ~/PdfAIAppProje/PdfAIServer (git clone kullandıysan)

yarn install
# veya: npm install

node src/index.js
```

Çıktıda `MongoDB connected` ve `Server listening on port 4000` görmelisin. Durdurmak için `Ctrl+C`.

---

## Adım 10 – Sürekli çalışması için PM2

```bash
sudo npm install -g pm2

cd ~/PdfAIServer
# veya: cd ~/PdfAIAppProje/PdfAIServer

pm2 start src/index.js --name pdfai
pm2 save
pm2 startup
```

`pm2 startup` çıktısında verilen komutu (sudo ile) kopyalayıp çalıştır (sunucu yeniden açılsa da uygulama başlasın diye).

Kontrol:

```bash
pm2 status
pm2 logs pdfai
```

---

## Adım 11 – Mobil uygulamada API adresi

Mobil uygulama (PdfAICli) production build’inde veya .env’de:

```
API_BASE_URL=http://PUBLIC_IP:4000
```

`PUBLIC_IP` = Oracle VM’in public IP’si (Adım 1’de not ettiğin). HTTPS yok; ileride domain + nginx + Let’s Encrypt eklenebilir.

---

## Özet komutlar (sunucuda)

| İşlem | Komut |
|--------|--------|
| PM2 durumu | `pm2 status` |
| Loglar | `pm2 logs pdfai` |
| Yeniden başlat | `pm2 restart pdfai` |
| Durdur | `pm2 stop pdfai` |

---

## Sorun giderme

- **Bağlanamıyorum (SSH):** Security List’te port 22 açık mı? IP doğru mu?
- **Uygulama API’ye ulaşamıyor:** Port 4000 Ingress’te açık mı? VM’de `pm2 status` ile pdfai “online” mı?
- **MongoDB bağlanamıyor:** `sudo systemctl status mongod` ile servis çalışıyor mu?
- **OpenAI hatası:** `.env` içinde `OPENAI_API_KEY` doğru ve bakiye var mı?

Bu adımlarla tek VM’de hem MongoDB hem backend 24 saat çalışır; maliyet 0 ₺ (Always Free). OpenAI kullanımı ayrı ücretlendirilir.

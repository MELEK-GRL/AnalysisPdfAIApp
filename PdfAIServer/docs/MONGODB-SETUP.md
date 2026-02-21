# MongoDB Atlas Bağlantı (Bad Auth Çözümü)

**"bad auth : authentication failed"** = `.env` içindeki kullanıcı adı veya şifre, Atlas’taki ile aynı değil.

## Bir kez yapın (geliştirme + canlı)

### 1. MongoDB Atlas

1. [cloud.mongodb.com](https://cloud.mongodb.com) → giriş yapın.
2. **Database Access** → ilgili kullanıcıyı seçin (veya **Add New Database User**).
3. **Edit** → **Edit Password**:
   - **Öneri:** Sadece **harf ve rakam** kullanın (örn. `MyDbPass123`).
   - `@ # $ % & + = / ?` gibi karakterler şifrede varsa bağlantıda URL-encode gerekir; karışıklığı önlemek için kullanmayın.
4. **Update User** ile kaydedin.

### 2. Bağlantı adresi (.env veya canlı ortam)

Format:

```
MONGODB_URI=mongodb+srv://KULLANICI_ADI:SIFRE@cluster.xxx.mongodb.net/VERITABANI_ADI?retryWrites=true&w=majority
```

- **KULLANICI_ADI:** Atlas Database Access’te oluşturduğunuz kullanıcı adı.
- **SIFRE:** Az önce belirlediğiniz şifre (özel karakter yoksa olduğu gibi yazın).
- **cluster.xxx.mongodb.net:** Cluster’ınızın adresi (Atlas → Connect → connection string’te görünür).
- **VERITABANI_ADI:** Kullandığınız DB adı (örn. `analysispdf`).

**Şifrede özel karakter varsa:** Tarayıcı konsolunda `encodeURIComponent('Sifreniz')` çalıştırıp çıkan değeri `SIFRE` yerine yazın.

### 3. Geliştirme (lokal)

- `PdfAIServer/.env` içinde `MONGODB_URI` değerini yukarıdaki gibi güncelleyin.
- Sunucuyu yeniden başlatın.

### 4. Canlı (production)

- Canlı ortamda (Railway, Render, Vercel, sunucu vb.) **environment variable** olarak `MONGODB_URI` tanımlayın.
- Değer olarak **aynı** bağlantı adresini kullanın (Atlas’ta belirlediğiniz kullanıcı + şifre).
- Atlas **Network Access**’te canlı sunucunun IP’sine izin verin (veya geçici test için `0.0.0.0/0`).

Bu adımları bir kez doğru yaptıktan sonra hem lokal hem canlıda aynı hesabı kullanırsanız tekrar "bad auth" çıkmaz.

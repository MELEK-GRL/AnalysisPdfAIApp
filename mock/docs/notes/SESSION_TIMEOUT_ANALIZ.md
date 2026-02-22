# 20 Dakika Sonra Otomatik Logout – Analiz

## İki senaryo

| Senaryo | Açıklama | Ne zaman çıkış? |
|--------|----------|------------------|
| **A) Sabit süre** | Girişten itibaren 20 dakika | Tam 20 dk sonra (kullanıcı işlem yapsa da) |
| **B) Hareketsizlik (inactivity)** | Son işlemden itibaren 20 dakika | Son etkileşimden 20 dk sonra |

Hangisini istediğinize göre uygulama farklılaşır.

---

## Seçenek 1: Sabit 20 dakika (girişten itibaren)

### Mantık
- Backend JWT süresini 20 dakika yapar.
- 20 dk sonra token geçersiz olur; bir sonraki API isteği 401 döner.
- Client 401’de token’ı siler, çıkış yapar ve Login ekranına döner.

### Yapılacaklar

**Backend (PdfAIServer)**  
- `src/constants.js`: `JWT_EXPIRES_IN = '7d'` → `'20m'` (veya env: `JWT_EXPIRES_IN=20m`).

**Client (PdfAICli)**  
1. **401’de otomatik logout**  
   - `apiFetcher.ts`: response interceptor’da `error.response?.status === 401` ise:
     - `clearToken()` çağır.
     - Auth store’da `logout()` çağır (veya en azından token + user’ı temizle).
  2. **Navigator’ın çıkıştan sonra Login’e dönmesi**  
   - Şu an navigator sadece ilk açılışta `hasToken` ile karar veriyor; 401 ile logout sonrası ekran güncellenmeli.
   - Öneri: Auth store’daki `token`’a abone ol (örn. `useAuthStore(s => s.token)`). Token `null` olduğunda Login’e dönmek için:
     - Stack’i `key={token ?? 'out'}` gibi bir değerle remount etmek, veya
     - Root’ta token yokken doğrudan Login (veya auth flow) ekranını göstermek.
  3. **Kullanıcı bilgilendirmesi (tercihen)**  
   - 401 sonrası tek seferlik “Oturumunuz sona erdi, tekrar giriş yapın” benzeri bir mesaj (Toast veya küçük modal).

### Artıları / eksileri
- Artı: Backend tek kaynak; token süresi kesin.
- Eksi: Kullanıcı tam 19. dakikada işlem yapsa bile 20. dakikada çıkış olur.

---

## Seçenek 2: 20 dakika hareketsizlik (inactivity)

### Mantık
- Client’ta “son aktivite zamanı” tutulur.
- Belirli aralıklarla (örn. her 1 dk) kontrol: “şu anki zaman − son aktivite > 20 dk” ise otomatik logout.
- Her “aktivite”te (ekran odaklanması, buton, API isteği vb.) son aktivite zamanı güncellenir.

### Yapılacaklar

**Backend**  
- Değişiklik gerekmez. JWT süresi 7d kalabilir; sadece client tarafında oturum kısıtlanır.

**Client**  
1. **Son aktivite zamanı**  
   - Bir store (Zustand) veya context: `lastActivityAt: number` (timestamp).  
   - İlk giriş: `lastActivityAt = Date.now()`.
2. **Aktivite sayılan yerler**  
   - Uygulama ön plana gelince (AppState `active`): `lastActivityAt = Date.now()`.  
   - İsteğe bağlı: Ana ekranlarda (Home, Geçmiş, Ayarlar) ekran odaklanınca (useFocusEffect) veya belirli butonlara basınca da güncelleme.
3. **Zamanlayıcı**  
   - Giriş yapılmışken (token varsa) periyodik kontrol (örn. setInterval 60 sn):  
     `if (Date.now() - lastActivityAt > 20 * 60 * 1000) { logout(); }`
4. **Logout**  
   - Mevcut `logout()`: token + auth state temizlenir.
5. **Navigator**  
   - Token yokken Login’e dönüş: Seçenek 1’deki gibi auth store’a abone olup token `null` olduğunda Login’i göstermek (key veya koşullu render).

### Artıları / eksileri
- Artı: Kullanıcı etkinken oturum açık kalır; sadece 20 dk hiç işlem yapmazsa çıkış olur.
- Eksi: Sadece client’ta; kullanıcı saati değiştirirse teorik oyun olabilir (pratikte genelde kabul edilir).

---

## Öneri

- **“Girişten itibaren kesin 20 dk”** istiyorsanız → **Seçenek 1** (JWT 20m + 401’de logout + navigator güncellemesi).
- **“20 dk boyunca hiç işlem yoksa çıkış”** istiyorsanız → **Seçenek 2** (inactivity timer + son aktivite güncellemesi).

İkisi de mevcut yapıyla uyumlu; hangisini istediğinizi söylerseniz o seçeneğe göre adım adım patch/örnek kod yazabilirim.

---

## Kısa teknik notlar

- **Token saklama:** `AsyncStorage` + `useAuthStore` (persist). Logout: `clearToken()` + store’da user/token null.
- **Navigator:** Şu an ilk mount’ta bir kere `hasToken` set ediliyor; 401 veya inactivity ile logout sonrası ekranın Login’e dönmesi için auth store’a (token) abone olup ekranı buna göre seçmek veya navigator’ı `key` ile remount etmek gerekiyor.
- **Süre sabiti:** 20 dakika client’ta `20 * 60 * 1000` (ms), backend’te `JWT_EXPIRES_IN = '20m'` olarak kullanılabilir.

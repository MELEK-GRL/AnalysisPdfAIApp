# Mock ve Planlama Klasörü

Bu klasör proje planlaması, sprint görevleri ve mock verileri için ayrılmıştır.

## Yapı

```
mock/
├── README.md           # Bu dosya
├── ANDROID_TROUBLESHOOTING.md  # Android ayağa kaldırma rehberi
├── BACKEND_TROUBLESHOOTING.md  # Backend / MongoDB sorun giderme
├── NETWORK_SETUP.md            # Emülatör → Backend bağlantı (Network Error)
├── HOSTING.md                  # Hosting ve domain gereksinimleri
├── SPRINTS.md          # Sprint task listesi (fazlar ve checkbox'lar)
├── PLAN.md             # Ana proje planı özeti
├── PLAYSTORE_CHECKLIST.md  # Play Store yayın kontrol listesi
└── data/               # Mock/test verileri
    ├── users.json
    ├── labResults.json
    └── analyses.json
```

## Projeyi Çalıştırma (Yarn)

**Önemli sıra:** Önce Backend, sonra Metro, en son Android/iOS.

```bash
# Terminal 1 - Backend (önce bu!)
cd PdfAIServer && yarn start

# Terminal 2 - Metro
cd PdfAICli && yarn start

# Terminal 3 - Android
cd PdfAICli && yarn android
```

**Network Error** alıyorsanız: Backend çalışıyor mu kontrol edin. Detay: [NETWORK_SETUP.md](NETWORK_SETUP.md)

## Kullanım

- **SPRINTS.md**: Her sprint için yapılacaklar listesi. Her task tamamlanınca `[x]` + `✓ Tamamlandı` yazılır. Sonraki task'a geçmeden önce kullanıcıdan izin alınır.
- **PLAN.md**: Fazlar, mimari ve teknik kararlar özeti.
- **PLAYSTORE_CHECKLIST.md**: Store'a çıkmadan önce kontrol edilecek maddeler.

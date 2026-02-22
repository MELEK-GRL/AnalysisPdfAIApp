# Mock ve Planlama Klasörü

Bu klasör proje planlaması, sprint görevleri ve mock verileri için ayrılmıştır.

## Yapı

```
mock/
├── README.md              # Bu dosya
├── docs/                  # Dokümantasyon (konuya göre gruplu)
│   ├── troubleshooting/   # Sorun giderme rehberleri
│   │   ├── ANDROID_TROUBLESHOOTING.md
│   │   ├── BACKEND_TROUBLESHOOTING.md
│   │   └── NETWORK_SETUP.md
│   ├── setup/             # Kurulum ve altyapı
│   │   ├── ENVIRONMENTS.md
│   │   ├── HOSTING.md
│   │   ├── ORACLE_CLOUD_KURULUM.md
│   │   └── RAILWAY_KURULUM.md
│   ├── playstore/         # Play Store yayın süreci
│   │   ├── PLAYSTORE_CHECKLIST.md
│   │   ├── PLAYSTORE_FORMLAR.md
│   │   ├── PLAYSTORE_GELISTIRMELER.md
│   │   └── PLAYSTORE_STORE_LISTING.md
│   ├── planning/         # Plan, fazlar ve sprintler
│   │   ├── PLAN.md
│   │   ├── SPRINTS.md
│   │   ├── FAZ4.md
│   │   ├── FAZ12-RELEASE.md
│   │   ├── FAZ12-TEST-CHECKLIST.md
│   │   └── EKSIKLER.md
│   ├── legal/            # Yasal / politika
│   │   └── PRIVACY_POLICY.md
│   └── notes/            # Analiz ve teknik notlar
│       ├── SESSION_TIMEOUT_ANALIZ.md
│       └── POPUPMODAL.md
└── data/                 # Mock/test verileri
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

**Network Error** alıyorsanız: Backend çalışıyor mu kontrol edin. Detay: [NETWORK_SETUP.md](docs/troubleshooting/NETWORK_SETUP.md)

## Kullanım

- **docs/planning/SPRINTS.md**: Her sprint için yapılacaklar listesi. Her task tamamlanınca `[x]` + `✓ Tamamlandı` yazılır.
- **docs/planning/PLAN.md**: Fazlar, mimari ve teknik kararlar özeti.
- **docs/playstore/PLAYSTORE_CHECKLIST.md**: Store'a çıkmadan önce kontrol edilecek maddeler.

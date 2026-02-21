# Tahlil Analizi – Uygulama İkonu ve Adı

## Uygulama adı

Cihazda ve mağazada görünen ad **"Tahlil Analizi"** olacak şekilde ayarlandı:

- **Android:** `android/app/src/main/res/values/strings.xml` → `app_name`
- **iOS:** `ios/PdfAICli/Info.plist` → `CFBundleDisplayName`
- **React Native:** `app.json` → `displayName`

Yeniden build alıp yüklediğinizde ad "Tahlil Analizi" olarak görünür.

### Yabancı dil (cihazda görünen ad)

- **Play Store:** Otomatik çeviri yok. Play Console → Uygulama → Mağaza ayarları → “Dil” bölümüne girip **İngilizce** (ve istersen diğer dilleri) ekleyin; her dil için başlık (örn. “Lab Analysis”) ve açıklamaları o dilde yazın. Kullanıcının mağaza dili neyse o listeleme görünür.
- **Android (cihaz diline göre ad):** İngilizce cihazlarda ikon altında **“Lab Analysis”** görünmesi için `values-en/strings.xml` eklendi. Türkçe / diğer dillerde “Tahlil Analizi” kalır.
- **iOS (İngilizce ad):** `ios/PdfAICli/en.lproj/InfoPlist.strings` içinde `CFBundleDisplayName = "Lab Analysis"` var. Xcode’da projeyi açıp **Info** sekmesinde **Localizations**’a İngilizce ekleyip bu dosyayı hedefe eklemeniz gerekebilir; sonra İngilizce cihazlarda “Lab Analysis” görünür.

---

## İkonu nasıl tasarlayıp değiştirirsiniz?

### 1. Tek bir ana görsel hazırlayın

- **Önerilen:** 1024×1024 px veya en az 512×512 px, PNG (şeffaf arka plan kullanabilirsiniz).
- Tema: Tahlil / sağlık / laboratuvar (rapor, damla, grafik, doküman vb.). Uygulama rengi mor olduğu için mor–beyaz veya mor–açık mor uyumlu olur.

### 2. Tüm boyutları üretmek için araçlar

Ana görselinizden tüm platform boyutlarını tek seferde üreten siteler:

- **[appicon.co](https://appicon.co)** – 1024×1024 yükleyin; Android + iOS paketi indirir.
- **[makeappicon.com](https://makeappicon.com)** – Aynı şekilde tek görselden tüm boyutlar.
- **Android Studio:** File → New → Image Asset → Launcher Icons; “Asset Type: Image” ile kendi PNG’nizi seçin, tüm mipmap’leri oluşturur.

### 3. Android’e yerleştirme

Oluşan veya el ile hazırladığınız PNG’leri şu klasörlere **aynı isimle** koyun (mevcut dosyaların üzerine yazın):

| Klasör | Dosya | Piksel |
|--------|--------|--------|
| `android/app/src/main/res/mipmap-mdpi/` | `ic_launcher.png`, `ic_launcher_round.png` | 48×48 |
| `android/app/src/main/res/mipmap-hdpi/` | aynı | 72×72 |
| `android/app/src/main/res/mipmap-xhdpi/` | aynı | 96×96 |
| `android/app/src/main/res/mipmap-xxhdpi/` | aynı | 144×144 |
| `android/app/src/main/res/mipmap-xxxhdpi/` | aynı | 192×192 |

Round ikon: Yuvarlak maskeli sürüm; çoğu araç bunu da üretir. Yoksa `ic_launcher_round` için de aynı kare ikonu kullanabilirsiniz (Android bazı cihazlarda yuvarlak keser).

### 4. iOS’a yerleştirme

- **appicon.co** vb. kullanıyorsanız: İndirilen iOS paketindeki `AppIcon.appiconset` içeriğini kopyalayın.
- Hedef klasör: `ios/PdfAICli/Images.xcassets/AppIcon.appiconset/`
- `Contents.json` içinde her boyut için dosya adı tanımlıdır; o isimlerle PNG’leri bu klasöre koyun.

### 5. Build ve test

- **Android:** `cd android && ./gradlew clean && cd .. && npx react-native run-android`
- **iOS:** Xcode’da Product → Clean Build Folder, sonra Run.
- Release/Play Store build’inde de aynı ikon ve “Tahlil Analizi” adı kullanılır.

---

## Projede hazır bir örnek ikon

`PdfAICli/assets/icon/` içine “Tahlil Analizi” temalı örnek bir ana ikon (1024×1024 veya 512×512) konabilir. Bu dosyayı veya kendi 1024×1024 PNG'nizi [appicon.co](https://appicon.co) / [makeappicon.com](https://makeappicon.com) ile yükleyip Android + iOS paketini indirin; çıkan dosyaları yukarıdaki klasörlere kopyalayın. **Önerilen:** AI tahlil temalı örnek ikon `PdfAICli/assets/icon/tahlil_analizi_ai_icon_1024.png` (yapay zeka + rapor/tahlil). Alternatif: `tahlil_analizi_icon_1024.png`.

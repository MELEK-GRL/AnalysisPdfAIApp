# Android Ayağa Kaldırma Rehberi

Android Studio'da veya emülatörde uygulama çalışmıyorsa aşağıdaki adımları sırayla kontrol edin.

---

## 1. Ön Gereksinimler

- **Node.js** 18+
- **Yarn** yüklü (`npm install -g yarn`)
- **Android Studio** (SDK, emülatör)
- **JDK 17** (zorunlu – JDK 24 vb. yeni sürümler Gradle 8.6 ile uyumsuz)

Kontrol:
```bash
node -v
yarn -v
echo $ANDROID_HOME
java -version
echo $JAVA_HOME
```

**Unsupported class file major version 68** hatası alıyorsanız: JDK 24 veya daha yeni sürüm kullanıyorsunuz. JDK 17’ye geçin (aşağıdaki JDK 17 bölümüne bakın).

---

## 2. JDK 17 (Zorunlu – React Native 0.74)

**Bu proje JDK 17 gerektirir.** JDK 11 desteklenmez (Gradle 8.6 + AGP 8.2 uyumlu değil).

Hata: `Unsupported class file major version 68` → JDK 24 kullanılıyor. JDK 17'ye geçin.

**macOS (Homebrew):**
```bash
brew install openjdk@17
```

**.zshrc** veya **.bash_profile** dosyanıza ekleyin:
```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
# veya Homebrew ile:
# export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
```

Sonra terminali yeniden açın veya `source ~/.zshrc`.

**Birden fazla Java varsa:**
```bash
/usr/libexec/java_home -V   # Tüm yüklü Java’ları listeler
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

JDK 17 yüklü değilse önce `brew install openjdk@17` çalıştırın.

**JDK 17 kullanırken crash/patlama olursa:** Gradle cache temizleyin: `rm -rf ~/.gradle/caches` sonra `./gradlew clean` ve `yarn android`.

---

## 3. ANDROID_HOME Ayarı

Android Studio ile gelen SDK için:

**macOS/Linux (.zshrc veya .bashrc):**
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

**Windows:** Sistem değişkenlerinden `ANDROID_HOME` = `C:\Users\KULLANICI\AppData\Local\Android\Sdk`

---

## 4. debug.keystore Eksikse

Proje `android/app/debug.keystore` bekliyor. Yoksa oluşturun:

```bash
cd PdfAICli/android/app
keytool -genkey -v -keystore debug.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000
```

Ad/Soyad vb. sorulursa istediğiniz değeri girebilirsiniz.

---

## 5. Bağımlılıklar

```bash
cd PdfAICli
yarn install
cd android
./gradlew clean
```

---

## 6. Metro Bundler

**Ayrı bir terminalde** Metro’nun çalıştığından emin olun:

```bash
cd PdfAICli
yarn start
```

Metro başladıktan sonra uygulamayı çalıştırın.

---

## 7. Uygulamayı Çalıştırma

### Emülatörden:
1. Android Studio → Device Manager → Emülatör başlat
2. Terminal:
```bash
cd PdfAICli
yarn android
```

### Android Studio üzerinden:
1. PdfAICli/android klasörünü **Open** ile açın (proje kökünü değil)
2. Sync Project with Gradle Files
3. Run → Run 'app'

**Önemli:** Proje kökü `PdfAIAppProje` ise, Android Studio'da `PdfAICli` klasörünü açın, `android` alt klasörünü değil.

---

## 8. Sık Hatalar

| Hata | Çözüm |
|------|-------|
| `ANDROID_HOME not set` | 2. adımı uygulayın, terminali yeniden açın |
| `debug.keystore not found` | 3. adım ile keystore oluşturun |
| `SDK location not found` | `PdfAICli/android/local.properties` oluşturun: `sdk.dir=/YOL/Android/sdk` |
| `Metro connection refused` | Önce `yarn start`, sonra `yarn android` |
| `Unable to load script` | Metro çalışıyor mu kontrol edin, `yarn start` ile yeniden başlatın |
| `Unsupported class file major version 68` | JDK 17 kullanın (Bölüm 2) |
| Gradle build fail | `cd android && ./gradlew clean` sonra tekrar deneyin |
| `Could not determine a usable wildcard IP` | `gradle.properties` içinde `org.gradle.jvmargs` satırına `-Djava.net.preferIPv4Stack=true` ekleyin |
| `ENOENT debugger-frontend rn_fusebox.html` | Metro cache temizle: `yarn start --reset-cache` veya temiz kurulum (aşağıya bakın) |

---

## 9. local.properties

Android Studio bazen otomatik oluşturur. Yoksa elle ekleyin:

`PdfAICli/android/local.properties`:
```properties
sdk.dir=/Users/KULLANICI/Library/Android/sdk
```

(macOS için; Windows'ta `C:\\Users\\KULLANICI\\AppData\\Local\\Android\\Sdk`)

---

## 10. Metro: ENOENT debugger-frontend rn_fusebox.html

React Native 0.74'teki deneysel debugger bu hatayı verebilir. Çözümler:

**A) Cache temizleyerek başlat:**
```bash
cd PdfAICli
yarn start --reset-cache
```

**B) Temiz kurulum:**
```bash
cd PdfAICli
rm -rf node_modules
rm -rf /tmp/metro-*
yarn install
yarn start --reset-cache
```

**C) Hata görünse bile:** Metro çalışıyorsa (`Dev server ready`) `a` veya `i` tuşuna basıp uygulamayı başlatmayı deneyin. Hata bazen sadece debugger açılırken oluşur, uygulama yine de çalışabilir.

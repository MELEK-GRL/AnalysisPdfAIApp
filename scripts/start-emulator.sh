#!/bin/zsh
set -e
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:/opt/homebrew/bin:$PATH"

echo "==> Eski emulator temizleniyor..."
pkill -9 -f "qemu-system" 2>/dev/null || true
pkill -9 -f "/sdk/emulator/emulator" 2>/dev/null || true
rm -f "$HOME/.android/avd/New_Device.avd/"*.lock 2>/dev/null || true
adb kill-server >/dev/null 2>&1 || true
sleep 1
adb start-server >/dev/null

echo "==> Emulator baslatiliyor (SwiftShader - daha stabil)..."
# Cursor shell'inden bagimsiz kalsin diye nohup + disown
nohup emulator -avd New_Device \
  -gpu swiftshader_indirect \
  -no-snapshot \
  -no-boot-anim \
  -no-audio \
  -memory 2048 \
  -cores 2 \
  > /tmp/pdfai-emulator.log 2>&1 &
EMU_PID=$!
disown $EMU_PID
echo "emulator pid=$EMU_PID  log=/tmp/pdfai-emulator.log"

echo "==> Boot bekleniyor..."
for i in {1..60}; do
  st=$(adb devices 2>/dev/null | awk '/emulator/{print $2}')
  boot=$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')
  echo "  $i  state=$st boot=$boot"
  if [[ "$st" == "device" && "$boot" == "1" ]]; then
    echo "==> Emulator HAZIR"
    adb reverse tcp:8081 tcp:8081 || true
    adb reverse tcp:4000 tcp:4000 || true
    exit 0
  fi
  # process oldu mu?
  if ! kill -0 $EMU_PID 2>/dev/null; then
    echo "HATA: Emulator process kapandi. Son log:"
    tail -40 /tmp/pdfai-emulator.log
    exit 1
  fi
  sleep 3
done
echo "TIMEOUT - emulator boot bitmedi"
tail -40 /tmp/pdfai-emulator.log
exit 1

#!/bin/zsh
set -e
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH"
ROOT="/Users/melek/Desktop/PdfAIAppProje"

# Backend
if ! curl -s -m 1 http://127.0.0.1:4000/health | grep -q ok; then
  osascript -e "tell application \"Terminal\" to do script \"cd '$ROOT/PdfAIServer' && yarn dev\""
fi

# Metro
if ! curl -s -m 1 http://127.0.0.1:8081/status | grep -q packager; then
  osascript -e "tell application \"Terminal\" to do script \"cd '$ROOT/PdfAICli' && yarn start --host 0.0.0.0\""
fi

# Emulator
if ! adb devices | grep -q emulator; then
  osascript -e "tell application \"Terminal\" to do script \"\$HOME/Library/Android/sdk/emulator/emulator -avd New_Device -netdelay none -netspeed full\""
fi

echo "Waiting for emulator..."
adb wait-for-device
until [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do sleep 2; done
adb reverse tcp:8081 tcp:8081
adb reverse tcp:4000 tcp:4000

echo "Waiting for Metro..."
until curl -s -m 1 http://127.0.0.1:8081/status | grep -q packager; do sleep 1; done

cd "$ROOT/PdfAICli" && yarn android

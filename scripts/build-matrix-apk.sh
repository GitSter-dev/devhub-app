#!/usr/bin/env bash
set -euo pipefail

# Usage: scripts/build-matrix-apk.sh [production|local] [out.apk]
# Builds an x86_64 release APK for the emulator matrix. "local" points the app at the host
# backend through the emulator's 10.0.2.2 alias and allows cleartext HTTP for that build only.

TARGET="${1:-production}"
OUT="${2:-device-matrix-output/devhub-matrix-$TARGET-x86_64.apk}"
MANIFEST=android/app/src/main/AndroidManifest.xml

case "$TARGET" in
  production) ;;
  local) export EXPO_PUBLIC_API_URL="${LOCAL_API_URL:-http://10.0.2.2:8080}" ;;
  *) echo "unknown target $TARGET (production|local)" >&2; exit 1 ;;
esac

export NODE_ENV=production
npx expo prebuild --clean --platform android --no-install
[ "$TARGET" = local ] && sed -i 's/<application /<application android:usesCleartextTraffic="true" /' "$MANIFEST"
(cd android && ./gradlew assembleRelease -PreactNativeArchitectures=x86_64)
mkdir -p "$(dirname "$OUT")"
cp android/app/build/outputs/apk/release/app-release.apk "$OUT"
echo "APK: $OUT"

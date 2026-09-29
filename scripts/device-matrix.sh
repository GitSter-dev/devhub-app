#!/usr/bin/env bash
set -euo pipefail

# Usage: [FLOWS=.maestro/signed-in/] scripts/device-matrix.sh <apk> [profile...]
# Boots each emulator profile in turn, applies its font, display-size, navigation and theme
# settings, installs the APK and runs the Maestro flows, saving screenshots per profile.

APK="${1:?usage: scripts/device-matrix.sh <apk> [profile...]}"
shift
SDK="${ANDROID_HOME:-$HOME/Android/Sdk}"
MAESTRO="${MAESTRO:-$HOME/.maestro/maestro/bin/maestro}"
OUT_ROOT="${OUT_ROOT:-device-matrix-output/$(date +%Y%m%d-%H%M)}"
FLOWS="${FLOWS:-.maestro/}"
PORT=5580
SERIAL="emulator-$PORT"
WINDOW_FLAGS=()
[ "${HEADLESS:-0}" = 1 ] && WINDOW_FLAGS=(-no-window)

#        name            avd                      font  density  nav          theme
PROFILES=(
  "small-a10         DH_Small_A10            1.0   default  threebutton  no"
  "infinix-a12       DH_Infinix_A12          1.3   368      threebutton  yes"
  "mainstream-a15    DH_Mainstream_A15       1.0   default  gestural     yes"
  "large-a16         DH_Large_Settings_A16   1.5   546      gestural     no"
)

wanted() { [ $# -eq 0 ] || [[ " $* " == *" $name "* ]]; }
selected=()
for row in "${PROFILES[@]}"; do
  read -r name _ <<<"$row"
  wanted "$@" && selected+=("$row")
done

step=0
for row in "${selected[@]}"; do
  read -r name avd font density nav dark <<<"$row"
  step=$((step + 1))
  tag="[$step/${#selected[@]}] $name"
  echo "$tag: booting $avd"
  "$SDK/emulator/emulator" -avd "$avd" -port "$PORT" "${WINDOW_FLAGS[@]}" -no-audio -no-snapshot -no-boot-anim >/dev/null 2>&1 &
  emu=$!
  adb -s "$SERIAL" wait-for-device
  started=$SECONDS
  until [ "$(adb -s "$SERIAL" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = 1 ]; do
    sleep 5
    echo "$tag: still booting ($((SECONDS - started))s)"
  done
  echo "$tag: booted in $((SECONDS - started))s; applying font $font, display size $density, $nav nav, dark=$dark"

  adb -s "$SERIAL" shell settings put system font_scale "$font"
  [ "$density" = default ] && adb -s "$SERIAL" shell wm density reset || adb -s "$SERIAL" shell wm density "$density"
  adb -s "$SERIAL" shell cmd overlay enable-exclusive --category "com.android.internal.systemui.navbar.$nav" >/dev/null 2>&1 || true
  adb -s "$SERIAL" shell cmd uimode night "$dark" >/dev/null
  until adb -s "$SERIAL" shell pm path android >/dev/null 2>&1; do sleep 2; done
  echo "$tag: installing $(basename "$APK")"
  adb -s "$SERIAL" uninstall com.application.devhub >/dev/null 2>&1 || true
  installed=0
  for attempt in 1 2 3; do
    if result="$(adb -s "$SERIAL" install -g "$APK" 2>&1)"; then
      installed=1
      break
    fi
    echo "$tag: install attempt $attempt failed ($(echo "$result" | tail -1)), retrying"
    sleep 15
  done
  if [ "$installed" != 1 ]; then
    echo "$tag: could not install $(basename "$APK"), skipping this profile"
    adb -s "$SERIAL" emu kill >/dev/null 2>&1 || true
    wait "$emu" 2>/dev/null || true
    continue
  fi
  echo "$tag: running flows"

  out="$(realpath -m "$OUT_ROOT/$name")"
  mkdir -p "$out"
  "$MAESTRO" --device "$SERIAL" test --test-output-dir "$out/raw" -e OUT="$name" "$FLOWS" \
    || echo "!! flow failed on $name (screenshots so far are kept)"
  find "$out/raw" -path '*takeScreenshot*' -name '*.png' -exec cp {} "$out"/ \;
  find "$out/raw" -path '*/screenshots/*' -name '*.png' -exec cp {} "$out"/ \;

  echo "$tag: done, $(ls "$out"/*.png 2>/dev/null | wc -l) screenshots in $out"
  adb -s "$SERIAL" emu kill >/dev/null 2>&1 || true
  wait "$emu" 2>/dev/null || true
done
echo "Screenshots in $OUT_ROOT"

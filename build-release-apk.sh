#!/bin/bash

echo "Building Release APK for CivilsAddaApp..."
echo ""

echo "Step 1: Generating JavaScript bundle..."
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res

if [ $? -ne 0 ]; then
  echo ""
  echo "ERROR: Failed to generate bundle!"
  exit 1
fi

echo ""
echo "Step 2: Cleaning previous builds..."
cd android
./gradlew clean

if [ $? -ne 0 ]; then
  echo ""
  echo "ERROR: Failed to clean build!"
  cd ..
  exit 1
fi

echo ""
echo "Step 3: Building Release APK..."
./gradlew assembleRelease

if [ $? -ne 0 ]; then
  echo ""
  echo "ERROR: Failed to build APK!"
  cd ..
  exit 1
fi

cd ..
echo ""
echo "========================================"
echo "SUCCESS! APK built successfully!"
echo "========================================"
echo ""
echo "APK Location:"
echo "android/app/build/outputs/apk/release/app-release.apk"
echo ""


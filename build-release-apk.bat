@echo off
echo Building Release APK for CivilsAddaApp...
echo.

echo Step 1: Generating JavaScript bundle...
call npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to generate bundle!
    pause
    exit /b %errorlevel%
)

echo.
echo Step 2: Cleaning previous builds...
cd android
call gradlew clean

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to clean build!
    cd ..
    pause
    exit /b %errorlevel%
)

echo.
echo Step 3: Building Release APK...
call gradlew assembleRelease

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to build APK!
    cd ..
    pause
    exit /b %errorlevel%
)

cd ..
echo.
echo ========================================
echo SUCCESS! APK built successfully!
echo ========================================
echo.
echo APK Location:
echo android\app\build\outputs\apk\release\app-release.apk
echo.
pause


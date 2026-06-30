# Building Release APK

## Quick Build (Recommended)

Use this command to bundle JavaScript and build the APK in one step:

```bash
npm run build-android-release-bundle
```

## Step-by-Step Build

### 1. Generate JavaScript Bundle

```bash
npm run bundle-android
```

This creates the JavaScript bundle at: `android/app/src/main/assets/index.android.bundle`

### 2. Build Release APK

```bash
npm run build-android-release
```

Or manually:
```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

## Output Location

The APK will be generated at:
```
android/app/build/outputs/apk/release/app-release.apk
```

## Important Notes

1. **First Time Setup**: Make sure the `assets` folder exists:
   ```bash
   mkdir -p android/app/src/main/assets
   ```

2. **Clean Build**: If you encounter issues, clean the build:
   ```bash
   cd android
   ./gradlew clean
   ```

3. **Metro Bundler**: The bundle command generates a standalone JavaScript bundle that's included in the APK, so Metro doesn't need to be running when you install the APK.

4. **Signing**: For production, you need to create a proper keystore. See: https://reactnative.dev/docs/signed-apk-android

## Troubleshooting

### Error: "Unable to load script"
- Make sure you ran `npm run bundle-android` before building
- Check that `android/app/src/main/assets/index.android.bundle` exists
- Clean and rebuild: `cd android && ./gradlew clean && ./gradlew assembleRelease`

### Error: "Bundle not found"
- Ensure the assets directory exists: `android/app/src/main/assets/`
- Re-run the bundle command


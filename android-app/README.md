# Android Studio Run Guide

## Open project

Open `android-app/` (not the repository root) in Android Studio.

## Required configuration

1. Edit `app/src/main/java/com/itay/callcollector/AppConfig.kt`:
   - Set `BACKEND_BASE_URL` to your Cloud Run URL.
2. Ensure Android SDK 34 is installed.
3. Ensure Gradle JDK is set to 17 in Android Studio.

## Run debug build

1. Select build variant `debug`.
2. Choose an Android device (prefer Samsung physical device).
3. Run the `app` configuration.

## Release / production build

1. Copy `keystore.properties.example` to `keystore.properties`.
2. Fill real signing values in `keystore.properties`.
3. Place your `.jks` file in `android-app/` (or set absolute path in `storeFile`).
4. Build release from Android Studio:
   - `Build > Generate Signed Bundle / APK`
   - or run Gradle task `:app:assembleRelease`.

If `keystore.properties` is missing, release builds still compile using debug signing for testing only.

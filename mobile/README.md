# Mobile App – Development Guide

This document explains how to run, build, and troubleshoot the React Native (Expo) mobile app for iOS and Android.

## Overview

- Framework: Expo + React Native
- Navigation: Expo Router
- Builds: EAS Build
- Backend API: Supabase-backed Node server deployed to Vercel

## Prerequisites

- Node.js LTS (v18+ recommended)
- Expo CLI and EAS CLI
    ```bash
    npm i -g expo-cli eas-cli
    ```
- Xcode (for iOS) and/or Android Studio (for Android)
- An Apple Developer account (for device builds on iOS)

## Configure API endpoint

The app reads the backend base URL from `src/constants.ts`.

```ts
// src/constants.ts
export const API_BASE_URL = IS_DEVELOPMENT
    ? "http://<your-lan-ip>:3001/api" // local server
    : "https://<your-vercel-app>.vercel.app/api"; // cloud
```

Tips

- For device testing on the same Wi‑Fi, replace `<your-lan-ip>` with your Mac’s IP (e.g., `ipconfig getifaddr en0`).
- If your device can’t reach your LAN IP, use Expo tunnel for Metro; the API must still be reachable directly.

## Install dependencies

```bash
cd mobile
npm install
```

## First-time: create an iOS dev client (one-time unless native changes)

```bash
eas build --profile development --platform ios
```

When the build completes, install the dev client on your iPhone via QR code or the link from EAS. You only need to rebuild the dev client when you add native modules or change SDKs.

## Daily development workflow

1. Start Metro bundler

```bash
npx expo start --dev-client --host tunnel
```

2. Open the app on your device (the dev client). It will connect to Metro and load your JS bundle.

Notes

- Use `--host tunnel` if LAN discovery fails.
- Press `r` in the Metro terminal to reload, `m` to toggle menu.

## Android development (optional)

If you prefer Android:

```bash
eas build --profile development --platform android
npx expo start --dev-client --host tunnel
```

Install the resulting APK/AAB on your Android device or emulator, then open the app.

## Rebuild the dev client when native changes

Rebuild if ANY of the following occurs:

- New Expo module with native code is added
- SDK version changes
- `app.json` native config changes

Commands

```bash
eas build --profile development --platform ios
npx expo start --dev-client --host tunnel
```

## Useful commands

```bash
# Start Metro for the dev client
npx expo start --dev-client --host tunnel

# Clean install
rm -rf node_modules && npm install

# Check device can reach local API (replace IP)
curl -sS http://<your-lan-ip>:3001/health | jq .
```

## Troubleshooting

- Device cannot connect to Metro
    - Use `--host tunnel` (firewall/NAT often blocks LAN)
    - Ensure phone and computer are on the same Wi‑Fi

- API calls fail on device but work in the simulator
    - Verify `API_BASE_URL` points to a reachable host from the device (LAN IP or cloud URL)
    - Confirm your server’s CORS settings allow the mobile app (current server uses permissive CORS)

- Images not saving
    - Ensure images are converted to base64 data URLs before sending (we use `imageAssetToDataUrl`)
    - For workouts, the server uploads to the `workouts` storage bucket and stores the public URL

## Production builds (brief)

Use EAS for distribution builds:

```bash
# iOS (TestFlight / App Store)
eas build --profile production --platform ios

# Android (Play)
eas build --profile production --platform android
```

Follow the prompts for signing credentials if you haven’t set them up.

## Backend smoke tests (cloud)

```bash
curl -sS https://<your-vercel-app>.vercel.app/health | jq .
curl -sS https://<your-vercel-app>.vercel.app/api/workouts | jq .
```

If you see errors in cloud but not locally, verify the Vercel environment variables (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and any others you rely on) and redeploy.

🧪 iOS Development Build Workflow (EAS + Expo)

This project uses Expo EAS Build for development and testing on iOS devices.

1️⃣ First-Time Setup — Create the Dev Client
eas build --profile development --platform ios

Builds a development client (.ipa) for your iPhone.

After the build finishes, install the app on your device using the QR code or link from Expo.

This only needs to be done once — unless you later add new native modules.

2️⃣ Daily Development — Run the App Locally

Once the dev client is installed, start the Metro bundler:

npx expo start --dev-client --host tunnel

Ensure your Mac and iPhone are on the same Wi-Fi.

Use --host tunnel if your device cannot connect via LAN.

Then open the app on your iPhone — it will automatically connect to Metro.

💡 You do not need to rebuild on EAS every time.
Just start Metro and open the app.

3️⃣ When Native Code Changes

If you:

Add a new Expo package that contains native code

Update SDK version or change native config in app.json

Rebuild your dev client:

eas build --profile development --platform ios
npx expo start --dev-client --host tunnel

Reinstall the new build, then continue development as usual.

✅ Typical Daily Flow

# Start Metro bundler

npx expo start --dev-client --host tunnel

# Then open the app on iPhone

## Uploading to TestFlight

TestFlight allows you to distribute beta builds to testers before releasing to the App Store.

### Prerequisites

- Apple Developer account enrolled in the Apple Developer Program ($99/year)
- Logged into EAS CLI with an account that has access to your Expo project
- Ensure your app identifier is registered in the Apple Developer Portal

### Step 1: Update Version Information

Before building, update the version in [app.json](app.json):

```json
{
  "expo": {
    "version": "1.0.0",        // User-facing version (bump for new features/fixes)
    "ios": {
      "buildNumber": "1"       // Incremental build number (must increase each upload)
    }
  }
}
```

**Version rules**:
- `version`: Semantic versioning (e.g., "1.0.0" → "1.0.1" → "1.1.0")
- `buildNumber`: Must be **unique and incrementing** for each TestFlight upload (e.g., "1" → "2" → "3")
- You can keep the same `version` and only bump `buildNumber` for internal test builds

### Step 2: Build for Production

Create an iOS production build:

```bash
eas build --profile production --platform ios
```

This will:
- Compile your app with production optimizations
- Sign it with your Apple Developer certificates
- Upload the build to EAS servers

The build typically takes 10-20 minutes. You can monitor progress at [expo.dev/builds](https://expo.dev/builds) or wait in the terminal.

### Step 3: Submit to TestFlight

Once the build completes successfully, submit it to App Store Connect:

```bash
eas submit --platform ios
```

EAS will:
- Automatically download the latest production build
- Upload it to App Store Connect
- Make it available in TestFlight within 5-10 minutes (after processing)

### Step 4: Manage TestFlight Testers

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Select your app → TestFlight tab
3. Add internal testers (up to 100, instant access) or external testers (unlimited, requires Apple review)
4. Testers will receive an email to install via the TestFlight app

### Troubleshooting

**Build fails with "Version already exists"**
- Increment `buildNumber` in [app.json](app.json)

**Submit fails with authentication errors**
- Run `eas login` and ensure you're logged in
- Check that your Apple ID has access to the App Store Connect team

**TestFlight build stuck "Processing"**
- Builds typically process in 5-15 minutes
- If stuck for 30+ minutes, check App Store Connect for error messages

**App crashes on TestFlight but not in development**
- Ensure production environment variables are set correctly
- Check that [src/constants.ts](src/constants.ts) points to your production API URL
- Review crash logs in Xcode Organizer or App Store Connect

### Quick Reference

```bash
# 1. Update version/buildNumber in app.json
# 2. Build
eas build --profile production --platform ios

# 3. Submit
eas submit --platform ios

# Alternative: Build and submit in one command (requires --auto-submit flag in eas.json)
eas build --profile production --platform ios --auto-submit
```    
 
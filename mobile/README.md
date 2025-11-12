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
  ? 'http://<your-lan-ip>:3001/api'  // local server
  : 'https://<your-vercel-app>.vercel.app/api'; // cloud
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

1) Start Metro bundler
```bash
npx expo start --dev-client --host tunnel
```

2) Open the app on your device (the dev client). It will connect to Metro and load your JS bundle.

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

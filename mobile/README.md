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

## Install dependencies

```bash
cd mobile
npm install
```

## Running the app locally

There are two ways to run the mobile app during development:

### Option A – Dev Client (recommended)

Use this if you have a custom dev client installed via TestFlight or EAS Build. This supports all native modules.

**First-time setup** — build the dev client once:

```bash
eas build --profile development --platform ios
```

Install the dev client on your iPhone via QR code or the link from EAS. You only need to rebuild when native dependencies change.

**Daily workflow:**

```bash
npx expo start --dev-client
```

Open the Trainichi dev client app on your device — it will connect to Metro and load your JS bundle.

### Option B – Expo Go (quick prototyping)

Use this for quick iteration without needing a native build. Some native modules won't work in Expo Go.

**Setup:**

1. Install Expo Go from the App Store
2. Log in on the CLI: `npx expo login`
3. Log in to the same Expo account in the Expo Go app

**Daily workflow:**

```bash
npx expo start --tunnel
```

Your project will appear on the Expo Go home screen. Tap to open.

> The `--tunnel` flag is required — local network mode does not work reliably.

## Android development (optional)

```bash
eas build --profile development --platform android
npx expo start --dev-client
```

Install the resulting APK/AAB on your Android device or emulator, then open the app.

## Rebuild the dev client when native changes

Rebuild if ANY of the following occurs:

- New Expo module with native code is added
- SDK version changes
- `app.json` native config changes

```bash
eas build --profile development --platform ios
```

## Useful commands

```bash
# Dev Client
npx expo start --dev-client

# Expo Go
npx expo start --tunnel

# Clean install
rm -rf node_modules && npm install

# Metro shortcuts: r = reload, m = toggle menu
```

## Troubleshooting

- **Device cannot connect to Metro**
    - Use `--tunnel` flag (firewall/NAT often blocks LAN)
    - Ensure phone and computer are on the same Wi-Fi

- **Expo Go: project not appearing**
    - Ensure you're logged in to the same Expo account on both CLI and the app
    - Make sure you're using `--tunnel` flag

- **API calls fail on device but work in the simulator**
    - Verify `API_BASE_URL` points to a reachable host from the device (LAN IP or cloud URL)
    - Confirm your server's CORS settings allow the mobile app (current server uses permissive CORS)

- **Images not saving**
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

Follow the prompts for signing credentials if you haven't set them up.

## Backend smoke tests (cloud)

```bash
curl -sS https://<your-vercel-app>.vercel.app/health | jq .
curl -sS https://<your-vercel-app>.vercel.app/api/workouts | jq .
```

If you see errors in cloud but not locally, verify the Vercel environment variables (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and any others you rely on) and redeploy.

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

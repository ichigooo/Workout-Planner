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

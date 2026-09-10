# GoVi Link — Mobile Client Application

Welcome to the mobile application for **GoVi Link**, a cross-platform mobile client designed for Field Officers and Chief Field Officers. This app manages field officer assignments, capital requests, job allocations, farmer and crop directory records, complaints, notifications, and location tracking.

Developed and maintained by **Polygon Holdings Private Limited**.

---

## 🚀 Features

*   **Secure Authentication & Profile Management**: Field officer login, session validation, token persistence with AsyncStorage, and background status checks.
*   **Chief Field Officer & Field Officer Workflows**:
    *   Job allocations and officer assignment management.
    *   Capital request submissions and request letter generation.
    *   Farmer profile and field management workflows.
*   **Complaints Logging & Resolution**: Log, track, and process field-level complaints.
*   **Multi-language Support**: Comprehensive translation support for English, Sinhala, and Tamil (`i18n`).
*   **Offline Data Handling**: `expo-sqlite` and Async Storage for offline data caching and synchronization.
*   **Hardware & Native Integrations**:
    *   `expo-camera` (for scanning and image capturing)
    *   `expo-location` (for tracking field officer locations)
    *   `expo-notifications` (for real-time push notifications)
    *   Image cropping and document attachment upload features

---

## 🛠️ Technology Stack

*   **Framework**: Expo SDK 54 / React Native (v0.81.5) with TypeScript
*   **Target Android Version**: Android 16 (API Level 36)
*   **State Management**: Redux Toolkit & React Context
*   **Navigation**: React Navigation (Drawer & Stack Navigators) with Expo Router
*   **Styling**: TailwindCSS via NativeWind (v4)
*   **Networking**: Axios with request/response interceptors
*   **Local Storage**: SQLite (`expo-sqlite`) and `@react-native-async-storage/async-storage`

---

## 📁 Project Structure

```
Govi-Link/
├── .expo/                # Expo development build files
├── android/              # Native Android project (Target SDK 36)
├── app/                  # App entry points & Expo Router navigation
├── assets/               # Images, fonts, icons, and JSON assets
├── component/            # React Native components
│   ├── add-feild-officers/ # Officer management & onboarding steps
│   ├── auth/             # Login, Profile, Splash, Banned screens
│   ├── capital-request/  # Capital request lists and letters
│   ├── chief-field-officer/ # Chief field officer dashboard & job assignments
│   ├── commons/          # Reusable UI components (Alerts, Headers, Search)
│   ├── complaint/        # Complaint logging & details
│   └── ...
├── context/              # Context providers
├── environment/          # API Base URL and environment configurations
├── services/             # API request handlers and Axios configuration
├── store/                # Redux store configurations and slices
├── utils/                # Helper utilities and translation assets
├── app.json              # Expo application manifest
├── eas.json              # EAS build configurations
├── package.json          # Dependency manifest
└── tsconfig.json         # TypeScript compiler configurations
```

---

## ⚙️ Getting Started

### 1. Pre-requisites
Ensure you have the following installed on your developer machine:
*   [Node.js](https://nodejs.org/) (v18 or higher recommended)
*   [Expo Go](https://expo.dev/client) app installed on your physical mobile device, or configured Android Emulator / iOS Simulator.

### 2. Installation
Clone the repository, navigate to the directory, and install the dependencies:
```bash
npm install
```

### 3. API Base URL Configuration
Open `environment/environment.ts` and configure the `API_BASE_URL` property to point to your running backend service:
```typescript
export const environment = {
  production: false,
  API_BASE_URL: "http://<YOUR_BACKEND_IP>:3000/govi-link/"
};
```
*Note: If testing on a physical device, use your machine's local IP address instead of `localhost`.*

### 4. Running the Development Server
Start the Metro bundler server:
```bash
npm run start
```
Once the server starts:
*   Press **`a`** to open the app on an Android Emulator.
*   Press **`i`** to open the app on an iOS Simulator.
*   Scan the QR code displayed in the terminal using the Expo Go app on a physical device.

---

## 📦 Deployment & Building

---

### 1. EAS Build (Cloud Build — Recommended)

Make sure you have EAS CLI installed and are logged in:
```bash
npm install -g eas-cli
eas login
```

#### 📦 Build AAB (Android App Bundle for Google Play Store)
Generates an `.aab` file targetting Android 16 (API 36) required for uploading/updating on Google Play Console (includes ProGuard `mapping.txt` deobfuscation file):
```bash
eas build --platform android --profile production
```

#### 📱 Build APK (Android Package for Direct Installation / Testing)
Generates an `.apk` file for direct installation on physical Android devices for testing:
```bash
eas build --platform android --profile preview
```

#### 🍎 Build iOS (IPA for Apple App Store / TestFlight)
Generates an `.ipa` build for iOS distribution:
```bash
eas build --platform ios --profile production
```

---

### 2. Local Gradle Build (On Your Machine)

#### 📦 Build AAB Locally
```bash
npx expo prebuild --platform android
cd android
./gradlew bundleRelease
```
*Output path*: `android/app/build/outputs/bundle/release/app-release.aab`
*Mapping file (Deobfuscation)*: `android/app/build/outputs/mapping/release/mapping.txt`

#### 📱 Build APK Locally
```bash
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```
*Output path*: `android/app/build/outputs/apk/release/app-release.apk`

---

## 🛡️ Deobfuscation File & Google Play Warning

If Google Play shows the warning:
> *There is no deobfuscation file associated with this App Bundle. If you use obfuscated code (R8/proguard), uploading a deobfuscation file will make crashes and ANRs easier to analyze and debug.*

1. **Automated Submission**: When deploying using `eas submit --platform android`, EAS automatically links and submits the `mapping.txt` file along with the AAB.
2. **Manual Upload**: If uploading the AAB manually to Google Play Console:
   - Go to **Google Play Console** > **App bundle explorer**.
   - Select the uploaded version.
   - Go to the **Downloads** tab > **Assets** / **Deobfuscation files**.
   - Upload the `mapping.txt` file generated during the build (available in the EAS Build dashboard artifacts or local `android/app/build/outputs/mapping/release/mapping.txt`).

---

## 📄 License

This project is licensed under the MIT License.

Copyright (c) 2026 **Polygon Holdings Private Limited**.

# Saloon Vero — Customer Mobile App 💇‍♂️✨📱

A premium **React Native + Expo SDK 54 + TypeScript** customer-facing mobile application designed for **Saloon Vero**. Seamlessly connected to a shared **Supabase** backend, this app brings real-time booking, user profiles, Google authentication, and gorgeous styling details to clients' fingertips.

---

## 🛠️ Tech Stack & Integration

<p align="left">
  <a href="https://reactnative.dev/">
    <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native" />
  </a>
  <a href="https://expo.dev/">
    <img src="https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  </a>
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  </a>
  <a href="https://supabase.com/">
    <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=3ECF8E" alt="Supabase" />
  </a>
  <a href="https://www.postgresql.org/">
    <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  </a>
  <a href="https://deno.com/">
    <img src="https://img.shields.io/badge/Deno-white?style=for-the-badge&logo=deno&logoColor=black" alt="Deno" />
  </a>
  <a href="https://zod.dev/">
    <img src="https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white" alt="Zod" />
  </a>
  <a href="https://jestjs.io/">
    <img src="https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white" alt="Jest" />
  </a>
</p>

---

## 🚀 Key Features

*   **🔐 Secure Authentication:**
    *   📧 Email and Password signup/login (Supabase Auth).
    *   🌐 **"Continue with Google"** OAuth integration via `expo-auth-session` and `expo-web-browser`, returning to the app through the `saloonveroapp://auth/callback` deep link.
    *   🕶️ **Guest mode:** browse services and book without an account — guest bookings are kept locally in AsyncStorage and surfaced in the Schedules tab.
*   **🎨 Aesthetics & Theming ("Warm Luxe"):**
    *   🌗 Curated light and dark brand modes driven automatically by the device's system settings.
    *   ✍️ Refined **Poppins** typography (weights from `400Regular` to `800ExtraBold`).
    *   ✨ Fluid animations and interactive press-feedbacks (0.97x button/card scaling) powered by `react-native-reanimated`.
*   **📅 Booking Wizard:**
    *   🚶‍♂️ Stepped flow: Service Selection $\rightarrow$ Stylist Choice (or *"Any Stylist"*) $\rightarrow$ Date $\rightarrow$ Real-Time Available Time Slots $\rightarrow$ Contact Details $\rightarrow$ Success (generates a unique `VS-XXXXX` reference code).
*   **👤 User Dashboard:**
    *   🖼️ Profile manager: edit name, phone number, and upload custom avatars directly to Supabase Storage (falls back to email-derived DiceBear avatars if un-configured).
    *   📋 **Schedules tab** displaying upcoming and past bookings with clear status pills (e.g., *Confirmed*, *Completed*, *Cancelled*).
    *   ✨ **New Things tab** highlighting fresh services and salon updates.

---

## 🧠 Architecture

*   **🧭 Expo Router Navigation:** The app uses Expo Router's file-based routing through the root `app/` directory, with grouped routes for auth, tabs, and booking flows.
*   **🛡️ Direct Database Access (Governed by RLS):** Public data (services, stylists, gallery, business hours) and authenticated user records (bookings, profiles) are fetched directly using the anonymous Supabase client key, protected by Row Level Security (RLS) policies.
*   **⚡ Secure Edge Functions:** Operations requiring the Supabase `service-role` key—specifically, computing stylist availability and reserving appointments safely without double-bookings—are delegated to two serverless Supabase Edge Functions:
    *   `get-availability` — Checks real-time schedules, including shop business hours, active stylists, confirmed bookings, and blocked slots.
    *   `create-booking` — Validates client forms, guards against double-booking race conditions, inserts rows, and issues confirmation references.
*   **🧩 Feature-Oriented Organization:** Shared UI, booking logic, API wrappers, auth helpers, validation schemas, and database types are separated into focused folders so the app is easy to extend.

---

## 📂 Project Structure

```text
Saloon_Vero_App/
  app/                         # 📂 Expo Router file-based screens and layouts
    _layout.tsx                # ⚙️ Global providers, fonts, splash handling, route setup
    index.tsx                  # ✨ Branded splash/onboarding entry screen
    access.tsx                 # 🚪 Sign-in / guest-mode gateway screen
    (auth)/                    # 🔐 Auth stack: login and signup
    (tabs)/                    # 📱 Main bottom tabs: Home, New Things, Book, Schedules, Account
    auth/callback.tsx          # 🌐 Google OAuth deep-link callback handler
    booking/                   # 📅 Booking flow routes
      [serviceId].tsx          # 🪄 Stepped booking wizard
      success.tsx              # 🎉 Booking confirmation screen

  assets/images/               # 🖼️ App icons, splash images, logo, onboarding artwork

  components/                  # 🧩 Reusable React Native components
    ui/                        # 💅 Warm Luxe UI primitives: buttons, cards, inputs, loaders
    auth/                      # 🕶️ Auth-related UI such as the guest-mode header
    booking/                   # 📅 Booking-specific UI such as SlotPicker
    services/                  # ✂️ Service presentation components
    stylists/                  # 👤 Stylist presentation components

  config/                      # 🔧 Environment and app configuration helpers
    env.ts                     # 🔑 EXPO_PUBLIC_* environment reader

  constants/                   # 🎨 Brand constants and design tokens
    theme.ts                   # 🌗 Colors, spacing, radius, shadows, typography

  context/                     # 🧠 React providers for app-wide state
    session.tsx                # 🔐 Supabase session provider and auth state

  hooks/                       # 🪝 Shared custom hooks
    use-theme.ts               # 🌗 Theme token access by color scheme

  lib/                         # 🧰 App logic separated by responsibility
    api/                       # ⚡ Supabase client, direct queries, Edge Function wrappers
    auth/                      # 🌐 Google OAuth flow helpers
    booking/                   # 📆 Booking reducer and availability calculations
    storage/                   # 🕶️ Local guest-booking persistence (AsyncStorage)
    utils/                     # 🕒 Formatters, references, avatar helpers, time utilities
    validation/                # ✅ Zod schemas for booking and customer details

  types/                       # 🧾 Shared TypeScript/domain types
    database.ts                # 🗄️ Supabase database type definitions

  __tests__/                   # 🧪 Jest unit and component test suites

  .env.example                 # 🔑 Safe placeholder env file for setup
  app.json                     # 📱 Expo app configuration (scheme: saloonveroapp)
  eas.json                     # ☁️ EAS build profiles (development / preview / production)
  package.json                 # 📦 Scripts and dependencies
  tsconfig.json                # 🧠 TypeScript configuration
```

---

## ⚙️ Getting Started

### 1. 📋 Prerequisites
Ensure you have Node.js and `npm` installed.

### 2. 🔑 Set Up Environment Variables
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```
Fill in the values from your Supabase dashboard:
*   `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase Project URL.
*   `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anonymous API key.

### 3. 📦 Install Dependencies
```bash
npm install
```

### 4. 🚀 Start the Application
Run the Expo CLI server:
```bash
npm start
```
You can choose to open the app using:
*   📱 **Expo Go** on a physical phone.
*   🤖 **Android emulator** (`a` in terminal) or 🍎 **iOS simulator** (`i` in terminal).
*   🌐 **Web browser** (`w` in terminal).
*   🛠️ A **development build** (recommended for testing Google login on a physical Android device):
    ```bash
    npx eas-cli build --profile development --platform android
    ```

### 5. 🌐 Google OAuth Redirect Setup
In the Supabase dashboard under **Authentication → URL Configuration**, add these Redirect URLs:
*   `saloonveroapp://auth/callback` — development/production builds.
*   `https://<your-web-domain>/auth/callback` — web.

> ⚠️ **Note:** Supabase rejects redirect URLs whose host is a LAN IP (e.g. `exp://192.168.x.x:8081/...`) even when allow-listed, and silently falls back to the Site URL. The app works around this in Expo Go by rewriting the redirect host to `localhost` (see `lib/auth/google.ts`), which Supabase always allows.

---

## 🧪 Testing

The codebase includes an automated test suite containing **34 tests across 12 suites**, covering state transitions, availability logic, Google OAuth redirect handling, environment validation, onboarding behavior, and custom components.

To run the tests:
```bash
npm test
```

To run the full local quality check before pushing:
```bash
npm run lint
npm test -- --runInBand
npx tsc --noEmit
```

---

## 🧼 GitHub Upload Notes

This project is ready to upload with source files, tests, configuration, and safe placeholders committed.

Ignored local-only files include:

```text
.env
.expo/
node_modules/
.vscode/
.claude/
.codex/
.agents/
AGENTS.md
CLAUDE.md
docs/
expo-env.d.ts
dist/
web-build/
ios/
android/
```

Keep `.env.example` committed so new developers know which environment variables are required, but never commit the real `.env` file. 🔐

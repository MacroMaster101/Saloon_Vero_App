# Saloon Vero — Salon Booking App 💇‍♂️✨📱

A premium **React Native + Expo SDK 54 + TypeScript** mobile application for **Saloon Vero**, serving **customers, stylists, and admins** from a single codebase with role-based experiences. Connected to a shared **Supabase** backend, the app brings real-time booking, stylist reviews & ratings, role dashboards, Google authentication, and gorgeous styling details to everyone's fingertips.

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

*   **👥 Role-Based Experiences (Customer · Staff · Admin):**
    *   🙋 **Customers** browse, book, manage their schedules, and review stylists.
    *   ✂️ **Staff (stylists)** get their own area: today's chair, weekly schedule, booking status actions (complete / no-show / cancel), and a "My Reviews" view with engagement stats.
    *   🛠️ **Admins** get a full management dashboard plus a walk-in booking desk.
    *   🧭 The correct area is resolved automatically from the signed-in user's profile role at the navigation layer (see `lib/auth/routing.ts`), with route guards in each group's `_layout.tsx`.
*   **🔐 Secure Authentication & Auto-Migration:**
    *   📧 Email and Password signup/login with **in-app 6-digit OTP** verification (Supabase Auth).
    *   🌐 **"Continue with Google"** OAuth integration via `expo-auth-session` and `expo-web-browser`, returning to the app through the `saloonveroapp://auth/callback` deep link.
    *   🔑 **Password reset** via emailed OTP code, then in-app new-password entry.
    *   🕶️ **Guest mode:** Browse services and book without an account. Bookings are kept locally in `AsyncStorage` and automatically claimed and merged into the user's account upon sign-up or login.
*   **🎨 Aesthetics & Theming ("Warm Luxe"):**
    *   🌗 Curated light and dark brand modes driven automatically by the device's system settings.
    *   ✍️ Refined **Poppins** typography (weights from `400Regular` to `800ExtraBold`).
    *   ✨ Fluid animations and interactive press-feedbacks (0.97x button/card spring-scaling via a shared `PressableScale` primitive), staggered list entrances, skeleton loaders, and centered safe-area-aware layouts — all powered by `react-native-reanimated`.
*   **📅 Booking Wizard:**
    *   🚶‍♂️ Stepped flow: Service Selection $\rightarrow$ Stylist Choice (or *"Any Stylist"*) $\rightarrow$ Date selection in a gorgeous 3-column square card grid (complete with `TODAY`/`TOMORROW` badges and custom amber branding for Poson Poya day) $\rightarrow$ Real-Time Available Time Slots $\rightarrow$ Contact Details $\rightarrow$ Success.
*   **👤 Schedules, Cancel & Reschedule (For All Users):**
    *   📋 **Schedules tab** displaying upcoming and past bookings styled as receipt-style records, with vertical left color status strips (gold for upcoming, green for completed, red for cancelled), ticket badges for reference codes, and flexible action rows.
    *   🔄 **Reschedule upcoming bookings**: Select a new date and time directly from the schedules list (available to both logged-in users and guests).
    *   ❌ **Cancel upcoming bookings**: Cancel bookings with simple confirmation prompts. Authenticated users verify via JWT, while guests verify via phone number ownership checks.
*   **⭐ Stylist Reviews & Ratings:**
    *   📝 Customers leave star ratings and written reviews for stylists from the home screen and the booking flow; a stylist's running average rating is recomputed via a single shared helper (`lib/utils/reviews.ts`).
    *   ❤️ **Engagement:** like/heart and report reviews, with per-device state persisted in `AsyncStorage` and optimistic UI that rolls back on failure.
    *   🛡️ **Admin moderation:** a dedicated admin Reviews screen lists all reviews, filters by stylist, surfaces report counts, and supports deletion (which re-derives the affected stylist's rating).
    *   🧰 Graceful fallbacks: when the database is unseeded or unreachable, screens fall back to local datasets so the UI never breaks.
*   **🛠️ Admin Dashboard:**
    *   📊 **Today** overview with revenue, completion %, capacity and the next booking.
    *   🚶 **Walk-in desk** to create bookings on behalf of customers.
    *   📋 **Bookings** management (search, filter by status/stylist, cancel).
    *   🧑‍🤝‍🧑 **People** screen to manage user roles and link staff accounts to stylist profiles.
    *   🖼️ Manage services, stylists, lookbook gallery items, and blocked slots directly in-app.
    *   📷 **Custom Photo Uploads**: upload headshots/service images (stored in Supabase Storage with the correct MIME type) or paste custom URLs, updating customer-facing lists in real time.
    *   ➕ **Bottom Floating Action Buttons (FABs)**: quick actions float cleanly above list views, automatically accounting for safe-area layout heights on iOS and Android.
*   **👤 User Profile Dashboard:**
    *   🖼️ Profile manager: edit name, phone number, and upload custom avatars directly to Supabase Storage (falls back to email-derived DiceBear avatars if un-configured).
    *   🌗 **Theme preference** (light / dark / system) persisted across sessions.
    *   ✨ **New Things tab** highlighting fresh services and salon updates.

---

## 🧠 Architecture

*   **🧭 Expo Router Navigation:** The app uses Expo Router's file-based routing through the root `app/` directory, with grouped routes for auth, customer tabs, staff, admin, and booking flows. The signed-in user's role determines which group they land in, enforced by guards in each group's `_layout.tsx`.
*   **🛡️ Direct Database Access (Governed by RLS):** Public data (services, stylists, gallery, business hours, reviews) and authenticated user records (bookings, profiles) are fetched directly using the anonymous Supabase client key, protected by Row Level Security (RLS) policies.
*   **⚡ Secure Edge Functions:** Operations requiring the Supabase `service-role` key—computing availability and mutating appointments safely without double-bookings—are delegated to serverless Supabase Edge Functions:
    *   `get-availability` — Checks real-time schedules, including shop business hours, active stylists, confirmed bookings, and blocked slots.
    *   `create-booking` — Validates client forms, guards against double-booking race conditions, inserts rows, and issues confirmation references.
    *   `reschedule-booking` — Moves an existing booking to a new date/time with the same conflict guarding.
    *   `cancel-booking` — Cancels a booking, verifying ownership (JWT for users, phone match for guests).
*   **🧩 Feature-Oriented Organization:** Shared UI, booking logic, API wrappers (per role), auth helpers, review utilities, business constants, validation schemas, and database types are separated into focused folders so the app is easy to extend.

---

## 📂 Project Structure

```text
Saloon_Vero_App/
  app/                         # 📂 Expo Router file-based screens and layouts
    _layout.tsx                # ⚙️ Global providers, fonts, splash handling, route setup
    index.tsx                  # ✨ Branded splash/onboarding entry screen
    access.tsx                 # 🚪 Sign-in / guest-mode gateway screen
    (auth)/                    # 🔐 Auth stack: login, signup, forgot-password (OTP)
    (tabs)/                    # 📱 Customer bottom tabs: Home, New Things, Book, Schedules, Account
    (staff)/                   # ✂️ Staff area: today, weekly schedule, account, my reviews
    (admin)/                   # 🛠️ Admin area: today, bookings, walk-in, and a `more/` hub
      more/                    #     ↳ services, stylists, gallery, blocked-slots, people, reviews
    auth/                      # 🌐 OAuth callback + password-reset routes
    booking/                   # 📅 Booking flow routes
      [serviceId].tsx          # 🪄 Stepped booking wizard
      success.tsx              # 🎉 Booking confirmation screen

  assets/images/               # 🖼️ App icons, splash images, logo, onboarding artwork

  components/                  # 🧩 Reusable React Native components
    ui/                        # 💅 Warm Luxe UI primitives: buttons, cards, inputs, loaders
    admin/                     # 🛠️ Admin-specific UI (photo picker, dashboard primitives)
    staff/                     # ✂️ Staff-specific UI (booking cards, metrics)
    auth/                      # 🕶️ Auth-related UI such as the guest-mode header
    booking/                   # 📅 Booking-specific UI such as SlotPicker
    services/                  # ✂️ Service presentation components
    stylists/                  # 👤 Stylist presentation components
    reviews/                   # ⭐ Shared review UI (e.g. StarRow)

  config/                      # 🔧 Environment and app configuration helpers
    env.ts                     # 🔑 EXPO_PUBLIC_* environment reader

  constants/                   # 🎨 Brand constants and design tokens
    theme.ts                   # 🌗 Colors, spacing, radius, shadows, typography
    salon.ts                   # 🏪 Business config: salon phone, Poya holiday calendar

  context/                     # 🧠 React providers for app-wide state
    session.tsx                # 🔐 Supabase session provider and auth state
    theme.tsx                  # 🌗 Theme preference (light/dark/system) provider

  hooks/                       # 🪝 Shared custom hooks
    use-theme.ts               # 🌗 Theme token access by color scheme
    use-countdown.ts           # ⏱️ Resend-code cooldown timer

  lib/                         # 🧰 App logic separated by responsibility
    api/                       # ⚡ Supabase client, queries, admin/staff APIs, Edge wrappers
    admin/                     # 🛠️ Admin helpers (slugify, stats, profile rules)
    auth/                      # 🌐 Google OAuth, routing, signup/error helpers
    booking/                   # 📆 Booking reducer and availability calculations
    staff/                     # ✂️ Staff bookings grouping/view helpers
    storage/                   # 🕶️ Local guest-booking persistence (AsyncStorage)
    utils/                     # 🕒 Formatters, references, avatar, time & review helpers
    validation/                # ✅ Zod schemas for booking and customer details

  types/                       # 🧾 Shared TypeScript/domain types
    database.ts                # 🗄️ Supabase database type definitions

  __tests__/                   # 🧪 Jest unit and component test suites (local-only, git-ignored)

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

The codebase includes an automated test suite containing **128 tests across 38 suites**, covering state transitions, availability logic, Google OAuth redirect handling, environment validation, onboarding behavior, staff status actions, admin/people role guards, and custom UI components (buttons, cards, loaders, skeletons, empty states, and entrance/press animations).

> ℹ️ The `__tests__/` folder is **git-ignored and kept local-only** — it is not uploaded to GitHub. The tests still run on your machine for local verification.

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

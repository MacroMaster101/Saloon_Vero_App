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
    *   🔒 **In-app password change** from every account screen (customer, staff, admin): email users re-enter their current password to confirm, while Google-only accounts can **set** a password to also sign in by email. Raw Supabase errors are mapped to friendly copy (`lib/auth/friendly-error.ts`).
    *   🕶️ **Guest mode:** Browse services and book without an account. Bookings are kept locally in `AsyncStorage` and automatically claimed and merged into the user's account upon sign-up or login.
*   **🎨 Aesthetics & Theming ("Warm Luxe"):**
    *   🌗 Curated light and dark brand modes driven automatically by the device's system settings.
    *   ✍️ Refined **Poppins** typography (weights from `400Regular` to `800ExtraBold`).
    *   ✨ Fluid animations and interactive press-feedbacks (0.97x button/card spring-scaling via a shared `PressableScale` primitive), staggered list entrances, skeleton loaders, and centered safe-area-aware layouts — all powered by `react-native-reanimated`.
    *   👆 A **first-run coach mark** on the welcome screen points at the theme toggle (a pointer bubble plus a pulsing accent ring), shown only to first-time users and dismissed on tap or after a few seconds (`components/ui/coach-tooltip.tsx`).
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
*   **💬 Real-Time Chat (Customer ↔ Stylist):**
    *   ⚡ One-to-one threads between a customer and a stylist, with **live message delivery** and **live unread counts** powered by Supabase Realtime (postgres-changes subscriptions on `messages` and `conversations`).
    *   📨 A floating chat button (`ChatFab`) on the customer home and schedules screens, plus the staff area, opens a unified **inbox** (`app/messages/`) that works for both sides — customers see stylists, stylists see their booked customers.
    *   📷 **Photo messages**: pick & crop one or more images, sent to a **private Supabase Storage bucket** and served via short-lived 1-hour signed URLs, with a full-screen image viewer.
    *   📅 **Booking cards in chat**: customers can deep-link from a booking to auto-attach its reference card to the thread; staff can attach any of that customer's bookings via a picker sheet.
    *   🔢 Per-side unread tracking and message previews are maintained by database triggers (`on_message_insert`), reset through a `mark_conversation_read` RPC (with a client-side fallback).
    *   🛡️ RLS limits each thread to its two participants; customers can start a conversation freely, while stylists may only open one with a customer who has booked them (enforced by the `is_stylist_user` helper).
*   **🔔 Push Notifications & Permission Priming:**
    *   📲 **Expo push notifications** for **booking events** (confirmed / cancelled / rescheduled → the customer) and **new chat messages** (→ the other participant). The device's Expo push token is registered after sign-in and stored in a `push_tokens` table (multi-device).
    *   ⚙️ Sends are server-side: the booking Edge Functions push directly, and a dedicated **`notify` Edge Function** (participant-verified) handles chat, both POSTing to the **Expo Push API** via a shared `sendExpoPush` helper.
    *   🪟 **Branded pre-permission priming** — before the OS prompt, a friendly modal (`PermissionPrimer`) explains *why* the app needs **photos**, **camera**, or **notifications**, shown once per permission. If permanently denied, the app offers an **Open Settings** shortcut.
    *   📷 **Camera capture** ("Take Photo") sits alongside library picking everywhere photos are chosen — avatar, chat, and the admin photo picker — so the camera permission is genuinely used.
    *   🕶️ Guests are unaffected (no account → no push registration), and notification permission is only requested for signed-in users.
*   **🛠️ Admin Dashboard:**
    *   📊 **Today** overview with revenue, completion %, capacity and the next booking.
    *   🚶 **Walk-in desk** to create bookings on behalf of customers.
    *   📋 **Bookings** management (search, filter by status/stylist, cancel).
    *   🧑‍🤝‍🧑 **People** screen to manage user roles and link staff accounts to stylist profiles.
    *   🖼️ Manage services, stylists, lookbook gallery items, and blocked slots directly in-app.
    *   📷 **Custom Photo Uploads**: upload headshots/service images (stored in Supabase Storage with the correct MIME type) or paste custom URLs, updating customer-facing lists in real time.
    *   ➕ **Bottom Floating Action Buttons (FABs)**: quick actions float cleanly above list views, automatically accounting for safe-area layout heights on iOS and Android.
*   **👤 User Profile Dashboard:**
    *   🖼️ **Avatar source switcher** — choose between a generated **DiceBear cartoon** (tap to shuffle a fresh one), your **email/Google account photo** (shown only when available), or a **custom upload** to Supabase Storage. The choice is saved on the user's auth metadata and applied everywhere the avatar appears.
    *   ✍️ Profile details (name, mobile) save through a dedicated form whose **Save / Cancel buttons appear only when something is edited**, with a confirmation on save; email is shown read-only.
    *   📊 A compact stats strip surfaces total and upcoming booking counts (upcoming computed by the same future-and-not-cancelled rule as the Schedules tab).
    *   🔒 A **Security** section to change (or, for Google accounts, set) the password without leaving the app.
    *   🌗 **Theme preference** (light / dark / system) persisted across sessions. Guests, who have no account page, get an inline theme toggle on the customer screens instead.
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
    *   `notify` — Participant-verified chat push trigger; the client calls it after sending a message and it pushes to the other side via the Expo Push API.
*   **💬 Realtime Chat Layer:** Conversations and messages live in their own RLS-guarded tables, with `postgres-changes` subscriptions driving live threads and unread badges, database triggers maintaining unread counts and previews, and a private Storage bucket (signed URLs) for photo messages.
*   **🔔 Notifications & Permissions:** Push tokens are stored per-device in a `push_tokens` table; sends run server-side from the booking functions and the `notify` function (shared `sendExpoPush` helper). On the client, a small `lib/permissions/` layer pairs the OS prompts with a branded priming modal mounted at the app root.
*   **🧩 Feature-Oriented Organization:** Shared UI, booking logic, API wrappers (per role), auth helpers, review utilities, business constants, validation schemas, and database types are separated into focused folders so the app is easy to extend.
*   **🛟 Root Error Boundary:** The root layout exports an Expo Router `ErrorBoundary` (`app/_layout.tsx`) that catches uncaught render errors and shows a friendly, retryable fallback instead of a white screen. It is intentionally self-contained (no theme/session context) so it still renders even if a provider is what threw — showing the error details in development and a generic message in production.

---

## 📂 Project Structure

```text
Saloon_Vero_App/
  app/                         # 📂 Expo Router file-based screens and layouts
    _layout.tsx                # ⚙️ Global providers, fonts, splash handling, route setup, root ErrorBoundary
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
    messages/                  # 💬 Chat inbox + threads (customer & stylist)
      index.tsx                #     ↳ inbox list of conversations
      [conversationId].tsx     #     ↳ live thread (text, photos, booking cards)

  assets/images/               # 🖼️ App icons, splash images, logo, onboarding artwork

  components/                  # 🧩 Reusable React Native components
    ui/                        # 💅 Warm Luxe UI primitives: buttons, cards, inputs, loaders
    admin/                     # 🛠️ Admin-specific UI (photo picker, dashboard primitives)
    staff/                     # ✂️ Staff-specific UI (booking cards, metrics)
    auth/                      # 🕶️ Auth-related UI such as the guest-mode header
    booking/                   # 📅 Booking-specific UI such as SlotPicker
    chat/                      # 💬 Chat UI: ChatFab, image bubble/viewer, booking cards
    permissions/               # 🪟 PermissionPrimer (branded pre-permission modal)
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
    api/                       # ⚡ Supabase client, queries, admin/staff/chat APIs, Edge wrappers
    admin/                     # 🛠️ Admin helpers (slugify, stats, profile rules)
    auth/                      # 🌐 Google OAuth, routing, signup/error & change-password helpers
    booking/                   # 📆 Booking reducer and availability calculations
    chat/                      # 💬 Chat helpers (image paths, message previews)
    notifications/             # 🔔 Push token registration (register.ts)
    permissions/               # 🛡️ Photo/camera permission helpers (priming + settings fallback)
    staff/                     # ✂️ Staff bookings grouping/view helpers
    storage/                   # 🕶️ Local guest-booking persistence (AsyncStorage)
    utils/                     # 🕒 Formatters, references, avatar, time & review helpers
    validation/                # ✅ Zod schemas for booking and customer details

  types/                       # 🧾 Shared TypeScript/domain types
    database.ts                # 🗄️ Supabase database type definitions

  supabase/                    # 🗄️ Backend definitions kept alongside the app
    migrations/                # 🧱 SQL migrations (ratings, reviews, reactions, chat, avatar storage, push tokens, …)
    functions/                 # ⚡ Edge Functions: get-availability, create/reschedule/cancel-booking, notify
      _shared/                 #     ↳ cors, service client, sendExpoPush push helper

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

### 6. 💬 Chat Backend (Realtime + Storage)
The chat feature relies on two extra Supabase configuration steps (also documented in `supabase/migrations/0009_chat.sql`):
*   **Realtime:** enable replication for the `messages` and `conversations` tables (Dashboard → **Database → Replication**, or `ALTER PUBLICATION supabase_realtime ADD TABLE …`).
*   **Private `chat` Storage bucket:** create a bucket named `chat` with **Public = OFF**, then apply the participant-only RLS policies on `storage.objects` (provided at the bottom of the migration) so only the two participants can read/write a thread's images.

### 7. 🖼️ Avatar Uploads (Storage policies)
Profile-photo uploads land in a **public `avatars` bucket** at the path `<user_id>/<timestamp>.jpg`. A *public* bucket only governs reads — **uploads still need RLS `INSERT` policies on `storage.objects`**, or they fail with `new row violates row-level security policy`. Run `supabase/migrations/0010_avatar_storage_policies.sql` (or paste it into the **SQL Editor**) to grant each authenticated user write access to **their own folder only**.

### 8. 🔔 Push Notifications
Booking and chat pushes need three pieces wired up:
*   **DB:** run `supabase/migrations/0011_push_tokens.sql` to create the `push_tokens` table (owner-only RLS).
*   **Edge Functions:** deploy `notify` (plus the existing `create-booking` / `cancel-booking` / `reschedule-booking`, which now send pushes): `supabase functions deploy notify`. They use the standard `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` env vars.
*   **EAS project ID:** push tokens require an EAS `projectId`. Run `eas init` (or your first `eas build`) — it writes `extra.eas.projectId` into `app.json`. Until then the app skips token registration gracefully (logs a warning, never crashes).

> ⚠️ **Push notifications cannot be tested in Expo Go on Android (SDK 53+)** — use an EAS **development** or **preview** build. The photo/camera **permission priming** works in any dev build. iOS push also requires running on a physical device with a development build.

---

## 🧪 Testing

The codebase includes an automated test suite containing **153 tests across 41 suites**, covering state transitions, availability logic, Google OAuth redirect handling, password-change & friendly auth-error mapping, environment validation, onboarding behavior, staff status actions, admin/people role guards, and custom UI components (buttons, cards, loaders, skeletons, empty states, and entrance/press animations).

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

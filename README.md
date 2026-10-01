# SameLine ⚽
**Where Kasi Football Lives** — The operating system for informal football in South Africa.

SameLine connects tournament organizers, team captains, and players across Gauteng townships (Katlehong, Vosloorus, Thokoza, Daveyton, Soweto, Tembisa). Organizers post tournaments in seconds, teams discover nearby games within 20km, fixtures and live scores are tracked in real-time, and teams build a persistent football reputation.

---

## 🏗️ Tech Stack

- **Framework:** Expo SDK 52, Expo Router v3 (file-based routing), TypeScript strict
- **State Management:** Zustand (auth, location, filters) + TanStack Query v5 (server state, caching)
- **Backend & Database:** Supabase (PostgreSQL 15, PostGIS spatial queries, Row Level Security, Realtime channels, Storage)
- **Monetization (v1):** RevenueCat (`react-native-purchases`) with 2 Pro tiers + Token consumable economy:
  - **Organizer Pro (R99/mo):** Unlimited tournaments, live scoring, featured boosts
  - **Team Pro (R99/mo):** Community Bank — unlocks community token contributions, fundraising asks (kit, entry fees), verified team badge
  - **Token Consumables:** 50 tokens (R25), 150 tokens (R69 - most popular), 350 tokens (R149), 750 tokens (R299)
- **Demo Dummy Accounts:** Instant role switching between Team Captain (Pro), Community Supporter, and Tournament Organizer without login barriers.

---

## 📱 The 16 Reference Screens

1. **Splash Screen** — Hero tournament silhouette with SameLine mark and loading status.
2. **Welcome Screen** — 3-second value proposition, location primer, and anonymous browsing entry.
3. **Login Screen** — Email/password auth, remember me, and Ekurhuleni social proof badge.
4. **Register Screen** — User registration with display name, email, and South Africa phone format (`+27`).
5. **Feed (Nearby Tournaments)** — Core discovery screen with township selector, filter chips, and rich tournament cards showing distances, slot progress, prize pools, and organizer details.
6. **Tournament Detail** — Hero match banner, 3-column quick info (Fee, Date, Slots), WhatsApp organizer contact, and top tabs (Teams, Fixtures, Info).
7. **Manage Tournament (Organizer View)** — Team request approvals/rejections with slot counter and interactive live match scoreboard updater.
8. **Create Tournament (Step 1: Basic Info)** — 2-step wizard, character counter, location pin with GPS accuracy, date selector, and live card preview.
9. **My Teams** — 2-column grid of owned and joined squads with 4-stat pills (Played, Wins, Finals, Titles).
10. **Create Team** — Club name, unique slug generation, township home base, logo upload with compression, bio, and squad position builder.
11. **Team Detail** — Team crest, verified badge, captain info, 4-stat bar, and Tournament History / Squad tabs.
12. **Profile** — User profile, Organizer Pro subscription card, organized tournaments, and POPIA-compliant account deletion.
13. **Paywall Screen** — Organizer Pro subscription benefits (unlimited tournaments, boosted placement, live scoring), R99/month pricing, and restore flow.
14. **Filter Modal** — Township selector, radius adjust, fee and tournament format filters.
15. **Tournament Detail (Fixtures Tab)** — Live match pulse indicators, live scores, and kickoff schedules.
16. **Create Tournament (Step 2: Details)** — Entry fee stepper, max teams selector (8, 16, 32), prize pool, WhatsApp contact, and submit.

---

## 🚀 Getting Started (Setup for SA Developers)

### 1. Prerequisites
- Node.js v18+ and npm
- Expo CLI (`npx expo`)
- Supabase CLI (`npm install -g supabase`)
- EAS CLI (for native builds: `npm install -g eas-cli`)

### 2. Installation
Clone the repository and install dependencies:
```bash
cd sameline
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your credentials:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_your_key
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_your_key
REVENUECAT_WEBHOOK_SECRET=your_webhook_secret
```

### 4. Supabase Setup & Migrations
1. Initialize and link your project:
   ```bash
   supabase login
   supabase link --project-ref your-project-ref
   ```
2. Push database schema, PostGIS extensions, triggers, and RLS policies:
   ```bash
   supabase db push
   ```
3. Deploy the RevenueCat webhook Edge Function:
   ```bash
   supabase functions deploy revenuecat-webhook --no-verify-jwt
   supabase secrets set REVENUECAT_WEBHOOK_SECRET=your_webhook_secret
   ```

### 5. RevenueCat Configuration
- **Entitlement Identifier:** `organizer_pro`
- **Product ID:** `sameline_organizer_pro_monthly`
- **Type:** Monthly auto-renewable subscription
- **Price:** R99.00 ZAR
- **Offering:** Set as current default offering
- **Webhook URL:** Set your deployed Supabase function URL: `https://your-project.supabase.co/functions/v1/revenuecat-webhook`

### 6. Running the App
- Run in Expo Go (feed browsing, team creation, fixtures):
  ```bash
  npm start
  ```
- Run with EAS Development Build (required for testing native RevenueCat purchases):
  ```bash
  eas build --profile development --platform android
  ```

---

## 🔒 Security & POPIA Compliance
- **Row Level Security (RLS):** All tables (`users`, `teams`, `tournaments`, `tournament_teams`, `fixtures`, `players`) have strict policies enforced.
- **Race Condition Protection:** Tournament join approvals use a row-locking Postgres trigger ensuring `team_count <= max_teams`.
- **POPIA:** Profile contains a self-serve Delete Account option executing `public.delete_user()`.

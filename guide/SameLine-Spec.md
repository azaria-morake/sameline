# SameLine — Technical Specification Document
**Version:** 1.0 MVP
**Date:** 2026-09-30
**Target Builder:** Senior Mobile Engineer (AI Agent) — 20+ years experience
**Platform:** Expo React Native (SDK 52+), TypeScript, Supabase, RevenueCat
**Location Context:** South Africa, Gauteng first — Katlehong / Ekurhuleni as pilot

---

## 1. Executive Summary

SameLine is the operating system for informal football in South Africa. Every weekend thousands of teams compete in cash tournaments, Top 8s, and local competitions organized via WhatsApp, posters, and word of mouth.

SameLine digitizes this: Organizers post tournaments in seconds, teams discover nearby games, fixtures/results are tracked, and teams build a persistent football identity.

**This MVP scope is intentionally narrow:** No PayFast/PayGate integration in v1. We are launching with RevenueCat for monetization only, to avoid SA payment gateway KYC delays. Tournament entry fees will be marked as "Cash on day / Contact organizer" in v1.

**Core Principle:** Built from inside the culture. Fast, simple, mobile-first, works on low-end Android devices.

---

## 2. Problem & Solution

**Problem:**
- No central place to discover tournaments
- No trusted registration system
- No history / reputation — teams start from zero every weekend
- Organizers spend hours forwarding posters to WhatsApp groups

**Solution (MVP):**
- Feed of nearby tournaments with distance, entry fee, slots left
- Organizer can create tournament in <60 seconds
- Teams can create profile and request to join
- Organizer approves teams, generates fixtures, posts results
- Team profile accumulates stats: Played, Wins, Finals, Titles

---

## 3. Tech Stack — Non-Negotiable

- **Framework:** Expo SDK 52+, Expo Router v3 (file-based routing), TypeScript strict
- **Language:** TypeScript
- **State:** Zustand for auth/user state, TanStack Query v5 for server state
- **Backend:** Supabase — Postgres 15, Auth, Realtime, Storage, Edge Functions (Deno)
- **Payments (v1):** RevenueCat — react-native-purchases v8+, react-native-purchases-ui for paywall
- **Maps/Geo:** Supabase PostGIS (ST_DWithin), no Google Maps SDK needed in v1. Use `expo-location` for user coords.
- **UI:** NativeWind (Tailwind for RN) or Tamagui — pick one, keep consistent. Must support dark mode.
- **Images:** expo-image
- **Forms:** react-hook-form + zod validation
- **Push:** expo-notifications (for fixture updates, approvals)

**Do NOT use:**
- Firebase Firestore / Auth
- Bare React Native CLI
- Redux

### Environment Variables (.env)

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxx
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxx
```

---

## 4. User Roles

1.  **Fan / Player (Anonymous + Authenticated):** Can browse tournaments, view team profiles. Must sign up to create team or join.
2.  **Team Captain:** Creates team, manages squad, requests to join tournaments.
3.  **Organizer:** Creates tournaments, approves/rejects teams, creates fixtures, posts scores. Requires `is_organizer_pro` entitlement to create >1 active tournament.

All users have one `users` row. Role is determined by entitlements + owned teams/tournaments.

---

## 5. Database Schema — Supabase Postgres

Enable extensions:
```sql
create extension if not exists postgis;
create extension if not exists "uuid-ossp";
```

### 5.1 Tables

**users**
- id: uuid (PK, FK to auth.users)
- phone: text (nullable, SA format)
- display_name: text
- avatar_url: text (storage ref)
- is_organizer_pro: boolean default false
- pro_expires_at: timestamptz nullable
- location: geography(Point, 4326) nullable — last known
- created_at: timestamptz

**teams**
- id: uuid PK default uuid_generate_v4()
- name: text not null
- slug: text unique (kebab-case)
- captain_id: uuid FK users.id
- logo_url: text
- location_text: text (e.g., "Katlehong")
- location: geography(Point, 4326) — home base
- bio: text
- stats: jsonb default '{"played":0,"wins":0,"finals":0,"titles":0}' — denormalized for fast reads, updated via trigger
- created_at

**tournaments**
- id: uuid PK
- organizer_id: uuid FK users.id
- title: text (e.g., "Katlehong Top 8 Cash Cup")
- description: text
- location_text: text
- location: geography(Point,4326) not null — pitch location
- start_date: date not null
- end_date: date
- entry_fee: int (in ZAR, e.g., 500)
- max_teams: int default 16
- team_count: int default 0 — maintained via trigger
- status: enum ['draft','open','closed','live','completed'] default 'open'
- prize_pool_text: text (e.g., "R5000 + Kit")
- contact_whatsapp: text
- is_featured: boolean default false — set if organizer has boost entitlement
- created_at

**tournament_teams (join)**
- id: uuid PK
- tournament_id: FK tournaments
- team_id: FK teams
- status: enum ['pending','approved','rejected','paid_cash'] default 'pending'
- requested_at
- Unique constraint (tournament_id, team_id)

**fixtures**
- id: uuid PK
- tournament_id: FK
- round: text (e.g., "Quarter Final", "Semi", "Final")
- team_a_id: FK teams nullable
- team_b_id: FK teams nullable
- team_a_score: int nullable
- team_b_score: int nullable
- status: enum ['scheduled','live','completed'] default 'scheduled'
- pitch_number: int nullable
- kickoff_time: timestamptz
- winner_team_id: FK teams nullable

**players (v1 minimal)**
- id: uuid PK
- team_id: FK teams
- user_id: FK users nullable (if player claims profile)
- name: text
- position: text

### 5.2 Indexes

```sql
CREATE INDEX idx_tournaments_location ON tournaments USING GIST (location);
CREATE INDEX idx_tournaments_start_date ON tournaments (start_date);
CREATE INDEX idx_tournaments_status ON tournaments (status);
CREATE INDEX idx_teams_location ON teams USING GIST (location);
```

### 5.3 Triggers

- On insert to tournament_teams where status=approved, increment tournaments.team_count
- On fixtures update to completed, increment teams.stats via function

### 5.4 Row Level Security (RLS) — Must Implement

Enable RLS on all tables.

**users:** User can read all, update only own row.

**teams:** Public read. Insert: authenticated. Update: captain_id = auth.uid()

**tournaments:**
- Read: all authenticated
- Insert: auth.uid() = organizer_id AND (is_pro = true OR count of active tournaments for this organizer < 1)
- Update: organizer_id = auth.uid()

**tournament_teams:**
- Read: all
- Insert: captain of team can request to join
- Update: organizer of tournament can approve/reject

**fixtures:** Read all, Write only organizer of tournament.

Implement helper function `is_organizer_pro()` that checks users.is_organizer_pro.

---

## 6. RevenueCat Integration — v1 Monetization Only

### 6.1 Products in RevenueCat

Entitlement: `organizer_pro`
Product ID: `sameline_organizer_pro_monthly`
Type: Monthly auto-renewable subscription
Price: R99 ZAR (set in Play Console/App Store Connect)

Entitlement: `boost` (future, create but don't expose in UI v1)

Offerings: `default` offering contains monthly package.

### 6.2 Client Implementation (Expo)

Install:
```
npx expo install react-native-purchases react-native-purchases-ui
```

Add to app.json:
```json
{
  "plugins": [
    ["react-native-purchases", {}],
    ["react-native-purchases-ui", {}]
  ]
}
```

Init service `services/revenuecat.ts`:
- configure with keys based on Platform.OS
- logIn(auth user id) on login
- logOut() on sign out
- getCustomerInfo()
- getOfferings()
- purchasePackage()
- addCustomerInfoUpdateListener to sync is_pro to Zustand + Supabase

**Critical:** After login, always call `Purchases.logIn(supabaseUserId)`. This links RC to Supabase. Do NOT use anonymous IDs for paid features.

Hook: `hooks/useRevenueCat.ts` must expose:
- isOrganizerPro: boolean
- isLoading
- offerings
- purchaseOrganizerPro()
- restorePurchases()
- presentPaywallIfNeeded()

Use `RevenueCatUI.presentPaywallIfNeeded({ requiredEntitlementIdentifier: 'organizer_pro' })` for fastest UI.

### 6.3 Server Webhook — Supabase Edge Function

Function: `supabase/functions/revenuecat-webhook/index.ts`

- Verify authorization header (RC webhook secret)
- Parse event
- Event types: INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION, BILLING_ISSUE
- Logic:
  ```
  app_user_id = event.app_user_id // this is Supabase user id
  if event.entitlement_ids contains organizer_pro and type in [INITIAL_PURCHASE, RENEWAL]:
    update users set is_organizer_pro=true, pro_expires_at=event.expiration_at where id=app_user_id
  if type in [CANCELLATION, EXPIRATION]:
    update users set is_organizer_pro=false where id=app_user_id
  ```
- Deploy and set URL in RevenueCat dashboard.

---

## 7. App Navigation — Expo Router

File structure:

```
app/
  _layout.tsx (Stack, RevenueCat provider, Supabase provider)
  (auth)/login.tsx, register.tsx
  (tabs)/
    _layout.tsx (Tabs: Feed, My Teams, Create, Profile)
    index.tsx -> Feed: nearby tournaments
    teams.tsx -> My Teams list
    create.tsx -> Gate: if !isOrganizerPro -> redirect to paywall
    profile.tsx
  tournament/[id].tsx -> Tournament detail, fixtures, teams
  team/[id].tsx -> Team profile, stats, history
  paywall.tsx -> RevenueCat paywall
components/
  TournamentCard.tsx
  TeamCard.tsx
  FixtureRow.tsx
hooks/
  useRevenueCat.ts
  useNearbyTournaments.ts
services/
  supabase.ts
  revenuecat.ts
  location.ts
```

### 7.1 Core User Flows

**Flow A: Discover (Anonymous allowed)**
1. App opens -> request location permission (expo-location)
2. Query: `useNearbyTournaments` — uses Supabase RPC `nearby_tournaments(lat,lng,radius=20000)`
3. Show cards: Title, location_text, distance (calculated via PostGIS), date, entry_fee, slots left
4. Tap -> tournament/[id]

**Flow B: Organizer Creates Tournament (Pro Gated)**
1. User taps Create tab
2. Check isOrganizerPro via hook
3. If false and user has 1 active tournament already -> show Paywall: "Organizer Pro — R99/mo — Unlimited tournaments, live scoring, featured listing"
4. If true or first tournament free -> Form: title, location (pick via map or text + lat/lng), date, entry_fee, max_teams, prize, WhatsApp
5. Insert to tournaments table
6. Success -> navigate to tournament/[id] with share button (WhatsApp share link)

**Flow C: Team Joins Tournament**
1. Team captain views tournament
2. Selects one of his teams (or create team first)
3. Insert into tournament_teams status=pending
4. Organizer gets push notification (expo-notifications)
5. Organizer approves -> team_count++, status=approved, team gets push

**Flow D: Live Scoring**
1. Organizer in tournament/[id] -> Manage Fixtures -> Create fixtures (select teams)
2. Update fixture scores -> fixture status=completed -> trigger updates team stats
3. Supabase Realtime subscription on fixtures for all viewers of that tournament

---

## 8. Key Implementation Details

### 8.1 Supabase Client (Expo)

`services/supabase.ts`:
- createClient with AsyncStorage for auth persistence (expo-secure-store for anon key is overkill, use AsyncStorage)
- Use `supabase.auth` for email/phone OTP. For v1, email + password is enough. Add phone OTP later.

### 8.2 Location Service

`services/location.ts`:
- `getCurrentLocation()` using expo-location
- Reverse geocode to get township name
- Store user location in users.location for personalization
- RPC function for nearby:

```sql
CREATE OR REPLACE FUNCTION nearby_tournaments(lat float, lng float, radius_m int)
RETURNS SETOF tournaments AS $$
  SELECT * FROM tournaments
  WHERE ST_DWithin(location, ST_MakePoint(lng, lat)::geography, radius_m)
  AND status IN ('open','live')
  ORDER BY start_date ASC, ST_Distance(location, ST_MakePoint(lng, lat)::geography) ASC
$$ LANGUAGE sql;
```

### 8.3 TanStack Query

All Supabase reads must go through TanStack Query with proper keys. Example:

```ts
useQuery({ queryKey: ['tournaments', 'nearby', lat, lng], queryFn: () => supabase.rpc('nearby_tournaments', {...}) })
```

### 8.4 Realtime

Enable Realtime on tournaments, tournament_teams, fixtures.

Subscribe in tournament detail:

```ts
supabase.channel(`tournament:${id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'fixtures', filter: `tournament_id=eq.${id}` }, refetch).subscribe()
```

### 8.5 Storage

Bucket: `team-logos`, `tournament-posters` (for future, when organizer uploads poster)
- Public read, authenticated write, 5MB limit, image/* only

### 8.6 Error Handling

- All forms: zod + react-hook-form
- Supabase errors mapped to user-friendly messages (e.g., RLS violation -> "Upgrade to Pro to create more tournaments")
- RevenueCat: handle userCancelled silently

---

## 9. UI/UX Requirements — MVP

- Design inspiration: Clean, bold, football culture. Dark mode default. Use township football imagery, not European.
- TournamentCard must show: title, location_text, distance, date, entry_fee in ZAR, team_count/max_teams progress bar, organizer name.
- Empty states: Illustrations, not just text. "No tournaments near you — be the first to post one in Katlehong"
- Loading states: Skeletons, not spinners everywhere.
- Performance: FlatList with getItemLayout, images optimized with expo-image.

---

## 10. Security Checklist

- [ ] RLS enabled on all tables
- [ ] anon key only used client side, service_role key only in Edge Functions
- [ ] RevenueCat webhook verifies secret header
- [ ] No SQL injection — use Supabase query builder, not raw SQL in client
- [ ] No storage of payment info — RevenueCat handles all
- [ ] POPIA: Users can delete account -> cascade delete or anonymize

---

## 11. File Structure Expected from Agent

```
sameline/
  app.json
  package.json
  .env.example
  supabase/
    migrations/ (SQL files)
    functions/revenuecat-webhook/
  src/
    app/ (expo router)
    components/
    hooks/
    services/
    stores/ (zustand)
    lib/ (utils)
    types/ (generated supabase types)
  README.md (how to run)
```

Agent must generate Supabase types: `npx supabase gen types typescript --project-id xxx > src/types/supabase.ts`

---

## 12. Deployment — EAS

- EAS Build configured for Android APK + AAB
- EAS Update for OTA
- Google Play internal testing track first
- RevenueCat must be in production mode before store submission

Steps for agent to document in README:
1. supabase init + link
2. supabase db push
3. expo install
4. eas build --profile development (for dev client with RevenueCat)
5. Test on device

---

## 13. MVP Acceptance Criteria (Definition of Done)

- [ ] User can sign up/login (email/password) and sees feed of nearby tournaments sorted by distance
- [ ] Organizer can create 1 tournament for free, second creation triggers RevenueCat paywall
- [ ] Purchase flow: Buy Organizer Pro monthly for R99, entitlement reflected in Supabase within 10s via webhook, user can now create unlimited
- [ ] Restore purchases works
- [ ] Captain can create team with logo upload to Storage
- [ ] Captain can request to join tournament, organizer can approve/reject, team_count updates correctly
- [ ] Organizer can create fixtures and update scores, all viewers see live update via Realtime
- [ ] Team profile shows aggregated stats (played/wins) updated via DB trigger
- [ ] Location search: tournaments within 20km radius using PostGIS, distance displayed
- [ ] No PayFast code in v1 — entry fee is display only with "Contact organizer on WhatsApp" button
- [ ] App works in Expo Go (except RevenueCat purchase which needs dev build) and dev build
- [ ] All tables have RLS and policies enforced

---

## 14. Future Roadmap (Do NOT build in v1, but architect for it)

- PayFast integration for entry fees: Add `payments` table, Edge Function for PayFast ITN, tournament_teams.status = paid
- Boost product: `is_featured` logic, cron to expire boosts
- Team Pro: verified badge, player stats
- Chat: tournament group chat via Supabase Realtime
- Sponsorship module

Agent: Leave TODO comments where PayFast will hook in, but do not implement.

---

## 15. Instructions to Agent

You are a senior mobile engineer. Build this MVP as production-ready code, not a prototype. Requirements:

1. TypeScript strict, no any
2. All Supabase queries typed with generated types
3. Handle loading, error, empty states for every screen
4. Write migrations, not manual SQL in dashboard
5. Document how to configure RevenueCat product IDs
6. Prioritize Android performance — test on low-end device profile
7. Commit messages conventional, README must include setup steps for a new dev in SA with Expo and Supabase CLI

Do not over-engineer. Ship MVP that can be tested in Katlehong this weekend.

END OF SPEC

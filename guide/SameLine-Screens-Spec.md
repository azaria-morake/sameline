# SameLine — Screens Specification
**Version:** 1.0 MVP — Companion to SameLine_Spec.md
**Stack:** Expo SDK 52, Expo Router, Supabase, RevenueCat
**Focus:** Screen name, components, payloads, UX, and hidden requirements

---

## 0. Navigation Map (Expo Router)

```
app/
  _layout.tsx -> Auth check, RevenueCat Provider, Splash
  (auth)/welcome.tsx
  (auth)/login.tsx
  (auth)/register.tsx
  (tabs)/_layout.tsx -> 4 Tabs
  (tabs)/index.tsx -> Feed
  (tabs)/teams.tsx -> My Teams
  (tabs)/create.tsx -> Create Tournament (Pro gated)
  (tabs)/profile.tsx -> Profile
  tournament/[id].tsx -> Tournament Detail
  tournament/[id]/manage.tsx -> Organizer Manage
  team/[id].tsx -> Team Detail
  team/create.tsx -> Create Team
  paywall.tsx -> Organizer Pro Paywall
  notifications.tsx
```

Deep links: `sameline://tournament/{id}`, `sameline://team/{id}` — must work from WhatsApp.

---

## 1. Welcome Screen
**Route:** `(auth)/welcome.tsx` | **Access:** Anonymous

**Purpose:** Explain value in 3 seconds for kasi organizer. Not a long onboarding.

**Components:**
1.  **HeroImage:** Full bleed image of kasi tournament, not European stock. Overlay gradient.
    - Payload: `image_url` (local asset), `overlay_text: "Where Kasi Football Lives"`
2.  **ValuePropList (3 items):**
    - Payload: `icon, title, subtitle` — "Post in 30s", "Find games nearby", "Build your rep"
3.  **CTA Buttons:**
    - Primary: "Find Tournaments Near Me" -> (tabs)/index.tsx (allow anonymous browse)
    - Secondary: "I Run Tournaments" -> (auth)/register.tsx with role=organizer intent

**UX Specs:**
- No carousel onboarding. One screen only. User can skip to feed.
- Button height 52px min for low-end Android touch targets.
- Skip auth wall for browsing — critical for adoption.
- Show location permission primer BEFORE system dialog: "We use your location to show games in Katlehong, Vosloorus, etc. — within 20km"

**Hidden Requirements:**
- Log analytics `welcome_viewed`, `welcome_find_tapped`
- Check if user already logged in -> redirect to tabs
- Cache location permission state in AsyncStorage

---

## 2. Login / Register Screens
**Route:** `(auth)/login.tsx`, `(auth)/register.tsx`

**Components:**
1.  **AuthForm:**
    - Payload: `fields: email, password, display_name (register only), phone (optional, SA format +27)`
    - Validation: zod — email, password min 6, phone regex `^\+27\d{9}$` or `^0\d{9}$`
    - Actions: `onSubmit -> supabase.auth.signUp/signIn`, `onError -> show toast`
2.  **SocialProof:** "Join 200+ teams in Ekurhuleni" — static text for v1, dynamic later
3.  **Link:** Toggle between login/register

**UX Specs:**
- Show password toggle
- Keyboard avoiding view, `returnKeyType=next`
- Error: Map Supabase errors to friendly: "Email already exists" not "User already registered"
- After register -> auto logIn RevenueCat with user.id, then go to feed

**Hidden:**
- On auth success, call `supabase.from('users').upsert({id, display_name})`
- Call `Purchases.logIn(supabaseUserId)` immediately
- Store display_name in Zustand

---

## 3. Feed — Nearby Tournaments (CORE SCREEN)
**Route:** `(tabs)/index.tsx` | **Access:** Public (anonymous can view, auth required to join)

**Purpose:** This is the home. User opens app, instantly sees what's on this weekend near them.

**Components:**

1.  **HeaderBar:**
    - Payload: `user_location_text: "Katlehong", notification_count: int`
    - Components: Location pill (tappable -> change radius), notification bell
    - Action: Tap location -> opens FilterModal

2.  **FilterChips (Horizontal Scroll):**
    - Payload: `filters: [{id: 'this_weekend', label: 'This Weekend', active: bool}, {id: 'open', label: 'Open'}, {id: 'under_R500', label: '< R500'}, {id: 'top8', label: 'Top 8'}]`
    - UX: Single select + clear all. Chip height 36px

3.  **TournamentCard List (FlatList):**
    - **Payload per card:**
      ```ts
      {
        id: string,
        title: string,
        location_text: string,
        distance_m: number, // calculated by PostGIS, show as "2.3km away"
        start_date: string, // ISO, display as "Sat, 12 Oct"
        entry_fee: number, // 500 -> "R500"
        team_count: number,
        max_teams: number,
        status: 'open'|'closed'|'live'|'completed',
        is_featured: boolean,
        organizer: { display_name: string, avatar_url: string },
        prize_pool_text: string
      }
      ```
    - Visual: If is_featured, gold border + "Boosted" badge top right
    - Progress bar: team_count/max_teams
    - Action: Tap -> tournament/[id]

4.  **EmptyState:**
    - Payload: `location_text, radius`
    - Message: "No games in 20km this weekend — Be the first to post in Katlehong"
    - CTA: "Post Tournament" (if organizer) else "Expand to 50km"

5.  **SkeletonLoader:** 3 cards shimmer while `useNearbyTournaments` loading

**UX Specs:**
- Pull to refresh -> refetch TanStack Query
- Infinite scroll: pagination via `limit 20 offset`
- Distance: Show in km with 1 decimal if <10km, else integer
- Date: Relative — "This Sat", "Next Sun", not just ISO
- Performance: `FlatList` with `initialNumToRender=6`, `windowSize=5`, `getItemLayout` fixed height 140px
- Offline: If no location permission, fallback to last known township or show all sorted by start_date, banner "Enable location to see distance"
- If no auth, "Join Tournament" button shows lock icon but still navigates to detail where it prompts login

**Hidden Requirements:**
- Query: Use RPC `nearby_tournaments(lat,lng,radius, status_filter)`
- Cache: TanStack Query staleTime 2 mins
- Realtime: Subscribe to new tournaments in 20km radius to auto-insert at top with "New" badge
- Analytics: `feed_viewed`, `tournament_card_tapped {id, distance}`
- Location denial: If denied, show manual township picker (Katlehong, Vosloorus, Thokoza, etc.)

---

## 4. Tournament Detail Screen
**Route:** `tournament/[id].tsx` | **Access:** Public view, actions auth-gated

**Components:**

1.  **HeroSection:**
    - Payload: `title, location_text, banner_image_url (optional), organizer {name, avatar, is_pro_badge}, status pill`
    - Action: Share button -> WhatsApp share `sameline://tournament/{id}` with text "Check this tournament: {title} — {location_text} — {date}"

2.  **InfoGrid (3 columns):**
    - Payload: `entry_fee, start_date, max_teams, prize_pool_text, contact_whatsapp`
    - Each item icon + value

3.  **ActionBar (Sticky bottom if status=open):**
    - Payload: `user_teams: Team[], already_requested: boolean, team_count/max_teams`
    - States:
      - Anonymous: "Login to Join" -> login
      - Captain with teams: Dropdown "Select Team" + "Request to Join" button
      - Already pending: Disabled "Pending Approval"
      - Approved: "You are in! View Fixtures"
      - Full: Disabled "Tournament Full"
    - Secondary: "Contact on WhatsApp" -> Linking.openURL(`https://wa.me/${contact_whatsapp}`)

4.  **Tabs inside detail (Top Tabs):**
    - **Teams Tab:** List of approved teams
      - Component: `TeamRow` — Payload: `team {logo, name, location_text, stats}`
    - **Fixtures Tab:** List grouped by round
      - Component: `FixtureRow` — Payload: `id, round, team_a {name,logo,score}, team_b, status, kickoff_time, winner_id`
      - Live: Pulse dot if status=live
      - If no fixtures yet: "Fixtures dropping soon — Organizer will post"
    - **Info Tab:** Description, rules, location map placeholder (text only v1, no map SDK)

5.  **OrganizerActions (Only if auth.uid() == organizer_id):**
    - Buttons: "Manage Tournament", "Create Fixtures", "Post Result"

**UX Specs:**
- Sticky header with back button + share
- Tabs swipeable
- FixtureRow height 72px, score bold 18px
- Pull to refresh updates fixtures via Realtime
- If tournament status=completed, show winner banner top

**Hidden:**
- Realtime channel `tournament:{id}` for fixtures + tournament_teams
- Deep link: When opened from WhatsApp, if app not installed, fallback to web (future) but for now just open app
- RLS: Anyone can read, only organizer can write — enforce in UI too (hide buttons)
- Analytics: `tournament_viewed`, `join_requested`

---

## 5. Manage Tournament Screen (Organizer Only)
**Route:** `tournament/[id]/manage.tsx` | **Access:** Organizer only, is_pro check

**Components:**

1.  **RequestList:**
    - Payload: `requests: [{id, team {name,logo,stats}, status: pending, requested_at}]`
    - Actions: Approve/Reject buttons (swipe actions also)
    - On Approve: Call supabase update status=approved, increment team_count via trigger, send push to captain

2.  **FixtureCreator:**
    - Payload: `approved_teams: Team[], rounds: string[]`
    - Form: Select Team A, Team B, Round dropdown, Kickoff time (date picker), Pitch number
    - Validation: Teams cannot be same, max fixtures based on max_teams
    - Action: Insert to fixtures table

3.  **ScoreUpdater:**
    - Payload: `fixture_id, team_a_score, team_b_score`
    - Component: Number stepper, winner auto-calculated
    - Action: Update fixture status=completed, winner_team_id
    - Trigger should update team stats

4.  **EditTournamentForm:**
    - Same fields as create, pre-filled
    - Action: Update tournament

**UX Specs:**
- Two tabs: Requests | Fixtures
- Approve action has confirmation: "Approve DK XI? 8/16 slots"
- Score input: Large number pad, not small text input
- Success toasts, not alerts
- If team_count == max_teams, auto set tournament status=closed (via Edge Function or client)

**Hidden:**
- Optimistic updates with TanStack Query
- Race condition: Two organizers approving at same time -> DB constraint team_count <= max_teams must be enforced via function
- Push notifications: On approve, send to team captain via expo-notifications

---

## 6. Create Tournament Screen
**Route:** `(tabs)/create.tsx` | **Access:** Auth required, Pro gated after 1 free

**Components:**

1.  **ProGateCheck (Logic, not UI):**
    - Payload: `isOrganizerPro, active_tournament_count`
    - If active_count >=1 and !isPro -> Redirect to paywall.tsx with params `reason=second_tournament`

2.  **Form (react-hook-form + zod):**
    - Fields and payload:
      - `title: string (min 5, max 60)` placeholder "e.g., Katlehong Top 8 Cash Cup"
      - `location_text: string` placeholder "e.g., Huntersfield Ground"
      - `location: {lat,lng}` — obtained via: Current location button + manual map pin (use expo-location + simple draggable map with react-native-maps or even just lat/lng inputs for v1 to avoid maps SDK)
      - `start_date: date` — Date picker, must be future
      - `end_date: date optional`
      - `entry_fee: number` — ZAR, step 50, min 0
      - `max_teams: number` — Select 8,16,32
      - `prize_pool_text: string` optional
      - `contact_whatsapp: string` SA phone, required
      - `description: string` optional, max 300 chars
    - Actions: `onSubmit -> supabase.from('tournaments').insert()`

3.  **PreviewCard:** Live preview of how TournamentCard will look as user types

**UX Specs:**
- Steps: 2-step wizard — Step 1 Basic, Step 2 Details — to reduce cognitive load
- Location: Primary CTA "Use Current Location" — shows "📍 Katlehong (2.1km accuracy)"
- If no location permission, allow typing township + manual lat/lng hidden behind "Advanced"
- Entry fee: Show helper "This is for display only in v1. You collect cash on the day"
- Button: "Post Tournament" -> loading -> success confetti (light) -> navigate to tournament/[id]
- Validation inline, not on submit only

**Hidden:**
- Before insert, check RLS: if not pro and count>=1, show error and redirect
- Generate slug from title + random
- Set team_count=0
- Analytics: `tournament_created {is_first_free}`

---

## 7. My Teams Screen
**Route:** `(tabs)/teams.tsx` | **Access:** Auth required

**Components:**

1.  **TeamList:**
    - Payload per team: `id, name, logo_url, location_text, stats {played,wins,titles}, role: captain|player`
    - Action: Tap -> team/[id]

2.  **CreateTeam CTA:** Floating action button "+ Create Team"

3.  **EmptyState:** "No teams yet — Create your first team to join tournaments"

**UX:**
- 2-column grid on large screens, list on small
- Show stats as small badges under name

---

## 8. Create Team Screen
**Route:** `team/create.tsx`

**Components:**

1.  **Form:**
    - `name: string min 3 max 30`
    - `location_text: string`
    - `logo: image` — Payload: `file, uri, storage_path` — Use expo-image-picker, compress to 500x500, upload to Supabase Storage `team-logos/{team_id}.jpg`
    - `bio: string max 150`

2.  **SquadBuilder (v1 minimal):**
    - Payload: `players: [{name, position}]` — simple list, add/remove

**UX:**
- Logo upload: Show placeholder with team initial if none
- Name uniqueness: Check slug uniqueness on blur, show "DK XI exists, try DK XI 2"
- After create -> navigate to team/[id]

---

## 9. Team Detail Screen
**Route:** `team/[id].tsx` | **Access:** Public

**Components:**

1.  **Header:** Logo (80px circle), name, location_text, captain name, bio, verified badge if captain is pro
2.  **StatsBar:** 4 columns — Played, Wins, Finals, Titles — from team.stats jsonb
3.  **Tabs:**
    - History: List of past tournaments + result (Champion, Finalist, Group)
      - Payload: `tournament {title, date, result}`
    - Squad: Player list
      - Payload: `players [{name, position, is_user}]`
    - Fixtures: Upcoming fixtures for this team across tournaments

**UX:**
- Stats bar large numbers, bold
- If stats all zero, show "Building legacy — 0 games tracked" with motivational copy

**Hidden:**
- Stats updated via DB trigger on fixtures.completed
- If user is captain, show Edit button

---

## 10. Profile Screen
**Route:** `(tabs)/profile.tsx`

**Components:**

1.  **UserHeader:** Avatar, display_name, phone, is_pro badge
2.  **EntitlementCard (if pro):** "Organizer Pro — Renews 12 Oct — Manage" -> links to RevenueCat customer center
3.  **MenuList:**
    - My Tournaments (organized)
    - Settings
    - Help / WhatsApp Support
    - Logout
    - Delete Account (POPIA)

**UX:**
- Show Pro status clearly, with upgrade CTA if not pro

---

## 11. Paywall Screen — Organizer Pro
**Route:** `paywall.tsx` | **Access:** Triggered by gating

**Components:**

1.  **BenefitsList:**
    - Payload: `benefits: [{icon,title}]` — "Unlimited tournaments", "Feature your tournament (boosted)", "Live scoring & fixtures", "Team stats & rep tracking"
2.  **PricingCard:**
    - Payload: `product {priceString: "R99 / month", trial: null}`
    - Show: Monthly price, billed monthly, cancel anytime
3.  **CTA:** "Upgrade to Organizer Pro" -> calls `purchaseOrganizerPro()`
4.  **Footer:** Restore purchases, Terms, "Why Pro? We keep SameLine free for teams"

**UX Specs:**
- MUST use RevenueCatUI if possible for store compliance — shows correct ZAR price from store
- Do NOT show custom price that mismatches store
- Loading state during purchase: Full screen overlay "Contacting Play Store..."
- Success: Confetti + "You are now Pro — Post unlimited" -> auto pop back to create screen
- Error: If userCancelled, do nothing. If error, show toast "Purchase failed — try again"
- Close button top right, but if triggered by second tournament gate, show "You need Pro for this" and disable close for 3 seconds (common pattern)

**Hidden:**
- Present paywall via `presentPaywallIfNeeded` for App Store compliance
- Log `paywall_viewed {reason}`, `purchase_started`, `purchase_completed`
- After purchase, Edge Function must update Supabase within 10s — show polling "Activating Pro..." if not immediate

---

## 12. Notifications Screen
**Route:** `notifications.tsx`

**Components:**
- List: `notifications [{type: 'team_approved'|'fixture_update'|'new_tournament_nearby', title, body, tournament_id, created_at, read: bool}]`

**UX:**
- Swipe to mark read
- Tap -> navigate to tournament

**Hidden:**
- For v1, local notifications only via Supabase Realtime -> expo-notifications. No FCM server yet.

---

## 13. Global Components & Design System

**TournamentCard, TeamRow, FixtureRow, Avatar, Badge, Button, Input, EmptyState, Skeleton**

Each must have:
- Props interface in TypeScript
- Loading skeleton variant
- Error variant
- Accessibility label

**Design Tokens:**
- Colors: Primary #111 (black), Accent #FFD60A (kasi yellow), Success #00C853
- Text: Inter font, heading bold
- Touch target min 48x48
- No tiny fonts — body min 14sp

**Other Important Info You Might Miss:**

1.  **WhatsApp Share is Distribution:** Every tournament detail must have share button that generates text: "⚽ {title} — {location_text} — {date} — R{fee} entry — {slots} slots left — Join on SameLine: sameline://tournament/{id}" — This is how you grow without ads.

2.  **Location Permission Denial Flow:** Many users will deny. You MUST have fallback: Show township picker (Katlehong, Vosloorus, Thokoza, etc.) + manual radius slider. Never show blank feed.

3.  **Image Compression:** Team logos from camera can be 8MB. Compress to max 800x800 JPEG 70% before upload or Storage costs explode. Use expo-image-manipulator.

4.  **Race Condition on Join:** Two teams request last slot simultaneously. Your DB must have check `team_count < max_teams` in a Postgres function with row-level lock, not just client check.

5.  **RevenueCat Anonymous ID Migration:** If user browsed anonymously then logs in, call `Purchases.logIn()` — RC docs say to do this or they lose entitlement.

6.  **EAS Build vs Expo Go:** RevenueCat purchases do NOT work in Expo Go. You must document: `eas build --profile development` -> install dev build -> test purchases. Feed browsing works in Expo Go.

7.  **ZARRING:** All ZAR values stored as integer cents? For v1 store as int (R500 not 50000) to keep simple, but document that future PayFast will need cents. Use int for now.

8.  **POPIA Compliance:** Profile must have Delete Account that calls `supabase.rpc('delete_user')` which anonymizes or deletes. SA law requires this.

9.  **Analytics Events to Implement from Day 1:** `app_open, feed_viewed, tournament_viewed, tournament_created, join_requested, join_approved, fixture_created, score_posted, paywall_viewed, purchase_completed`

10. **Performance Budget:** Feed must render in <2s on Tecno Spark 8 (low-end Android). Use FlashList not FlatList if possible, limit Realtime to one channel at a time, paginate fixtures.

---

## 14. What Agent Must Deliver for Screens

For each screen file, agent must include:
- Loading, Error, Empty, Success states
- TanStack Query hooks with queryKey
- Supabase typed queries
- RevenueCat gating where needed
- Accessibility props
- Analytics log call (console.log for v1 is fine, placeholder for PostHog later)

Agent must NOT build screens with mocked data only — must wire to Supabase from start.

END

# Grain build log

---

## 2026-05-02 — Initial MVP built by Replit Agent

Replit Agent scaffolded the full MVP from the build prompt.

**What was created:**
- React + Vite + Tailwind CSS + React Router project
- `src/lib/supabase.js` — Supabase client with graceful no-op fallback if env vars absent
- `src/lib/localStorage.js` — synchronous CRUD for rolls and frames
- `src/lib/chemistry.js` — chemistry presets and dev step constants (local JS, no DB table)
- `src/pages/RollList.jsx` — roll list, empty state, "Load New Roll" modal
- `src/pages/RollDetail.jsx` — frame grid, status dropdown, roll notes, frame note modal
- `src/pages/DevTimer.jsx` — chemistry selector, 4-step pipeline, countdown, agitation banner

---

## 2026-05-02 — 4 fixes applied (Claude Cowork)

### Fix 1 · Push/pull field in New Roll modal (`RollList.jsx`)
- Added a 6-button stepper (−2 / −1 / 0 / +1 / +2 / +3) to the new roll form
- Defaults to 0 (box speed)
- Shows plain-language description below the stepper ("Pushing 2 stops…")
- Roll list surfaces push/pull as an amber badge on each card

### Fix 2 · Active roll card on Roll List (`RollList.jsx`)
- Most recent `in_camera` roll now appears as a distinct hero card at the top
- Includes a 12-column mini frame grid (filled amber squares = shot frames)
- Remaining rolls shown in a compact "Recent Rolls" list below
- Roll count shown in header

### Fix 3 · Unified async data service (`src/lib/dataService.js` — new file)
- All data access goes through `dataService.js` — async versions of every CRUD function
- Strategy: write to localStorage immediately (optimistic UI), then sync to Supabase
- Falls back to localStorage if Supabase errors or is not configured
- `RollList.jsx` and `RollDetail.jsx` updated to use async/await with useEffect

### Fix 4 · Timer state persistence (`DevTimer.jsx`)
- Timer saves `{ chemistryId, currentStepIndex, timeLeft }` to `grain_timer_state` in localStorage
- State restored on mount — step and countdown resume from where they left off
- Timer always starts paused after a page reload
- State cleared on completion or Reset
- `navigator.vibrate` called on each agitation reminder

### Fix 5 · Unmark frame (`RollDetail.jsx`)
- Frame note modal includes "Unmark as shot" button with confirmation
- Calls `deleteFrame` then recalculates `frames_shot` on the roll

---

## 2026-05-02 — Settings, bottom nav, Supabase migration

### New files
- `src/components/BottomNav.jsx` — 3-tab nav (Rolls · Timer · Settings), inline SVG icons, active tab amber
- `src/pages/Settings.jsx` — default frame count, ISO, °F/°C toggle, About section, Clear All Data
- `supabase/migrations/001_initial.sql` — creates `rolls` and `frames` tables with indexes
- `public/manifest.json` — PWA manifest (installable on phone home screen)

### Updated files
- `src/App.jsx` — Settings route wired, BottomNav rendered on all screens
- `src/pages/RollList.jsx` — reads `grain_settings` for default frame count and ISO

---

## 2026-05-02 — Auth, onboarding, PWA

### New files
- `src/hooks/useAuth.js` — Supabase session management, exports `{ session, user, loading, signOut }`
- `src/pages/Auth.jsx` — magic link login screen with success state and error handling
- `src/pages/Onboarding.jsx` — first-launch welcome screen, sets `grain_onboarded` in localStorage
- `supabase/migrations/002_auth_rls.sql` — adds `user_id` column, enables RLS on both tables

### Updated files
- `src/App.jsx` — auth gate: onboarding → auth → app routes, amber spinner on load
- `src/pages/Settings.jsx` — Account section with signed-in email + Sign Out button
- `index.html` — PWA meta tags, manifest link, Apple touch icon
- `src/pages/DevTimer.jsx` — bottom padding fix so Begin Process button clears nav bar
- `src/components/BottomNav.jsx` — hidden on onboarding and auth screens

---

## Current state (end of 2026-05-02)

**Working:**
- Full roll logging with frame counter, push/pull, status pipeline
- Dev timer with chemistry presets, agitation alerts, crash-proof persistence
- localStorage data layer (fully offline)
- Settings screen, bottom nav, PWA installable
- Onboarding screen, magic link auth UI
- Supabase tables created and RLS policies applied

**Pending (resume here next session):**
1. **Republish in Replit** — env vars added after last deploy, Supabase not yet live in production
2. **Custom SMTP via Resend** — fixes 4/hr magic link rate limit before sharing with others
3. **Supabase redirect URL** — already set to `https://grain--x130.replit.app` ✅
4. **Supabase Site URL** — updated from localhost:3000 to production URL ✅

**GitHub repo:** https://github.com/perzival-22/grain-app  
**Live URL:** https://grain--x130.replit.app  
**Supabase project:** https://onoppwfjoambsivnhdqc.supabase.co

---

## Phase 2 — when ready to continue

- Supabase Auth fully tested end-to-end
- Camera collection manager
- Lab order tracker
- Community film stock ratings
- Scan gallery (attach images to completed rolls)

# Grain — Product Requirements Document

## Overview

**App name:** Grain  
**Tagline:** Your darkroom in your pocket.  
**Type:** Mobile-first progressive web app  
**Stack:** React + Vite, Tailwind CSS, Supabase, React Router

---

## The Problem

Analog film photographers have no dedicated mobile tool for managing their workflow. Today, they track rolls, development chemistry, and scan results across physical notebooks, spreadsheets, and memory. This leads to:

- Lost notes on which rolls are in which camera
- Forgotten push/pull settings at the development stage
- Missed agitation steps during development, ruining entire rolls
- No record of which film stocks, chemistries, or techniques produced the best results

There is no purpose-built, mobile-friendly tool that covers the full analog workflow from loading a roll to archiving scans.

---

## Target User

**Primary:** Analog film photographers who shoot 35mm and medium format.  
**Profile:** Ages 18–40, shoot 2–10 rolls per month, develop their own film at home or use a mail-in lab, care about craft and process, are comfortable with mobile apps but frustrated by generic note-taking tools.

**Secondary:** Film photography beginners who want guided workflows and chemistry presets to remove the guesswork from home development.

---

## MVP Features (v1.0)

These three screens form the complete MVP and will be built first.

### 1. Roll Logger
- Log a new film roll with: stock name, camera, ISO, push/pull stops
- 36-frame (or 120-frame) visual counter — tap to mark frames as shot
- Add a note to any individual frame
- Status pipeline: In Camera → Shot → Developing → At Lab → Scanned
- View all rolls in a list sorted by most recent

### 2. Dev Timer
- Select a chemistry from preset list (HC-110 Dil.B, D-76, Rodinal 1+50, Ilfosol 3, ID-11, XTOL)
- Shows recommended dev time at 68°F / 20°C
- Step-by-step pipeline: Pre-soak → Developer → Stop Bath → Fixer
- Countdown timer with pause/resume
- Agitation reminder banner every 30 seconds during developer step
- "Next step" button to advance through pipeline

### 3. Film Stock Library (read-only in MVP)
- Browse a seeded list of common film stocks
- View stock details: ISO, character notes, typical dev times

---

## Phase 2 Features

- **Community film stock ratings** — users rate stocks they've shot, see aggregated scores
- **Lab order tracker** — log a mail-in order, track status (sent → received → scanned)
- **Camera collection manager** — track which cameras you own, current roll in each
- **Scan gallery** — attach scan images to a completed roll
- **Push/pull dev time calculator** — adjusts dev time based on ISO override
- **User accounts** — Supabase auth, data syncs across devices

---

## Phase 3 Features

- **pH strip scanner** — use device camera to read pH strip colour and confirm fixer health
- **Bluetooth thermometer integration** — connect a dev thermometer, auto-adjust times for temperature
- **Recipe builder** — save custom chemistry dilutions and times
- **Sharing** — share a roll's details or a stock review to social media

---

## Monetisation

| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | Up to 5 rolls stored, basic dev timer, chemistry presets |
| Pro | $5/month | Unlimited rolls, community features, lab tracker, scan gallery |
| Pro Annual | $45/year (~25% saving) | All Pro features at discounted rate |

No ads. Ever. The app is a tool, not a platform.

---

## Success Metrics

| Metric | Target (90 days post-launch) |
|--------|------------------------------|
| Daily Active Users (DAU) | 500 |
| Rolls logged per user per month | ≥ 3 |
| Dev timer sessions per week | ≥ 1 per active user |
| Pro conversion rate | ≥ 8% of active free users |
| 30-day retention | ≥ 40% |

---

## Design Principles

1. **Dark by default** — the app should feel at home in a darkroom. Primary bg `#1a1a18`, surface `#2C2C2A`, amber accent `#EF9F27`, text `#F1EFE8`.
2. **Mobile-first** — max width 430px, designed for one-handed use.
3. **Offline-capable** — dev timer and frame counter must work without internet. Use localStorage as a fallback.
4. **Zero friction logging** — adding a new roll should take under 30 seconds.
5. **Minimal, purposeful UI** — no decorative clutter. Every element earns its place.

---

## Constraints & Non-Goals for MVP

- **No auth in MVP** — single user, no login screen. Supabase is used for persistence but without row-level security yet.
- **No social features in MVP** — no sharing, ratings, or community content.
- **No image uploads in MVP** — scan gallery is Phase 2.
- **35mm only in MVP** — 120 format (16 or 12 frames) is Phase 2.
- **English only** — localisation is not in scope.

---

## Open Questions / Decisions Needed

1. **Chemistry temperature** — should dev times adjust dynamically for temperature, or just show the 68°F baseline? (Recommend: baseline for MVP, dynamic in Phase 3)
2. **Frame count** — should the app default to 36, 24, or let the user choose? (Recommend: let the user choose from 24/36 when logging a roll)
3. **Supabase project** — you'll need a Supabase project URL and anon key before the build can connect to a real database. Set these as environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. **Offline sync strategy** — when offline changes and online data conflict on reconnect, which wins? (Recommend: local always wins for MVP, last-write-wins for Phase 2)
5. **Film stock seed data** — do you have a preferred list of stocks to seed, or should the app use a common 20–30 stock list?

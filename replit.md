# Grain — Film Roll Tracker

A mobile-first web app for analog photographers to track their film rolls, frames, and development.

## Tech Stack

- **Frontend:** React 19 + Vite 8
- **Styling:** Tailwind CSS v4 (via @tailwindcss/vite plugin)
- **Routing:** React Router v7
- **Database:** Supabase (optional) with localStorage fallback
- **Build:** Vite, port 5000

## Colour Theme

- Background: `#1a1a18`
- Surface: `#2C2C2A`
- Accent: `#EF9F27` (amber)
- Text: `#F1EFE8`

## Project Structure

```
src/
  App.jsx              — Router setup (3 routes)
  main.jsx             — React entry point
  index.css            — Tailwind import + global styles
  lib/
    supabase.js        — Supabase client (optional, env-gated)
    localStorage.js    — Full CRUD via localStorage (default data layer)
    chemistry.js       — Dev chemistry presets (HC-110, D-76, Rodinal, etc.)
  pages/
    RollList.jsx       — Home screen (/) — list all rolls, add new
    RollDetail.jsx     — Roll view (/roll/:id) — frame grid, status, notes
    DevTimer.jsx       — Dev timer (/timer) — step pipeline + agitation reminders
```

## Screens

1. **Roll List** (`/`) — All logged rolls, floating "+" to add, tap to open detail
2. **Roll Detail** (`/roll/:id`) — 36-frame grid, status pipeline, editable fields
3. **Dev Timer** (`/timer`) — Chemistry selector, countdown per step, agitation alerts

## Data Layer

The app uses **localStorage by default** with no login required.

To enable Supabase, set these environment variables:
- `VITE_SUPABASE_URL` — your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — your Supabase anon/public key

The Supabase client in `src/lib/supabase.js` is null when env vars are absent, so the app works offline without any configuration.

## Database Schema (Supabase)

```sql
-- rolls
id uuid primary key
created_at timestamp
film_stock text
camera text
iso integer
push_pull integer default 0
frames_shot integer default 0
frame_count integer default 36
status text  -- in_camera | shot | developing | at_lab | scanned
notes text

-- frames
id uuid primary key
roll_id uuid references rolls(id)
frame_number integer
note text
shot_at timestamp
```

## Development

```bash
npm run dev    # starts on port 5000
npm run build  # production build
```

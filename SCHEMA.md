# Grain — Database Schema

## Storage Strategy

| Data | Lives In | Reason |
|------|----------|--------|
| Rolls | Supabase + localStorage mirror | Core user data, needs persistence across devices in Phase 2 |
| Frames | Supabase + localStorage mirror | Tied to rolls |
| Chemistry presets | Local JS constant | Static reference data, no user customisation in MVP |
| Film stock library | Local JS constant (MVP) → Supabase table (Phase 2) | Read-only in MVP, grows with community data |
| Camera collection | Supabase (Phase 2) | Not in MVP |
| Lab orders | Supabase (Phase 2) | Not in MVP |

In MVP, Supabase is the source of truth. If Supabase is unavailable, localStorage is used as a write-ahead cache and synced on reconnect.

---

## MVP Tables

### `rolls`

The core table. One row per film roll loaded into a camera.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PRIMARY KEY, default `gen_random_uuid()` | |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | When the roll was logged |
| `film_stock` | `text` | NOT NULL | e.g. "Kodak Portra 400" |
| `camera` | `text` | NOT NULL | e.g. "Pentax K1000" |
| `iso` | `integer` | NOT NULL | Box speed (e.g. 400) |
| `push_pull` | `integer` | NOT NULL, default `0` | Stops pushed (+) or pulled (−). Range: −2 to +3 |
| `frame_count` | `integer` | NOT NULL, default `36` | Total frames on the roll (24 or 36 for 35mm) |
| `frames_shot` | `integer` | NOT NULL, default `0` | How many frames have been marked as shot |
| `status` | `text` | NOT NULL, default `'in_camera'` | See status enum below |
| `notes` | `text` | nullable | Free-text notes on the whole roll |
| `started_at` | `timestamptz` | nullable | When the roll was loaded into camera |
| `finished_at` | `timestamptz` | nullable | When the last frame was shot |

**Status enum** (enforced in app logic, not as a DB type in MVP):
- `in_camera` — roll is loaded, shooting in progress
- `shot` — all frames exposed, roll removed from camera
- `developing` — roll is in the dev tank
- `at_lab` — roll sent to mail-in or drop-off lab
- `scanned` — development complete, negatives scanned

**Indexes:**
```sql
CREATE INDEX rolls_status_idx ON rolls(status);
CREATE INDEX rolls_created_at_idx ON rolls(created_at DESC);
```

---

### `frames`

One row per individual frame on a roll. Created on demand when the user taps a frame.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PRIMARY KEY, default `gen_random_uuid()` | |
| `roll_id` | `uuid` | NOT NULL, REFERENCES `rolls(id)` ON DELETE CASCADE | |
| `frame_number` | `integer` | NOT NULL | 1–36 (or 1–24) |
| `note` | `text` | nullable | User note for this specific frame |
| `shot_at` | `timestamptz` | nullable | Timestamp when frame was marked as shot |

**Constraint:**
```sql
UNIQUE(roll_id, frame_number)
```

**Index:**
```sql
CREATE INDEX frames_roll_id_idx ON frames(roll_id);
```

---

## Phase 2 Tables

### `film_stocks`

Seed data + community-contributed stocks.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PRIMARY KEY | |
| `name` | `text` | NOT NULL, UNIQUE | e.g. "Kodak Portra 400" |
| `brand` | `text` | NOT NULL | e.g. "Kodak" |
| `iso` | `integer` | NOT NULL | Box speed |
| `format` | `text` | NOT NULL | `35mm` or `120` |
| `type` | `text` | NOT NULL | `color_negative`, `bw_negative`, `slide` |
| `character_notes` | `text` | nullable | Short description of the stock's look |
| `is_discontinued` | `boolean` | default `false` | |
| `created_at` | `timestamptz` | default `now()` | |

---

### `cameras`

User's camera collection.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PRIMARY KEY | |
| `user_id` | `uuid` | NOT NULL | Supabase auth user id |
| `name` | `text` | NOT NULL | e.g. "Pentax K1000" |
| `format` | `text` | NOT NULL | `35mm`, `120`, `large_format` |
| `current_roll_id` | `uuid` | nullable, REFERENCES `rolls(id)` | Which roll is currently loaded |
| `notes` | `text` | nullable | |
| `created_at` | `timestamptz` | default `now()` | |

---

### `lab_orders`

Tracking mail-in development orders.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PRIMARY KEY | |
| `user_id` | `uuid` | NOT NULL | |
| `lab_name` | `text` | NOT NULL | e.g. "The Darkroom" |
| `shipped_at` | `timestamptz` | nullable | |
| `received_at` | `timestamptz` | nullable | When lab confirms receipt |
| `returned_at` | `timestamptz` | nullable | When scans arrive back |
| `status` | `text` | NOT NULL, default `'preparing'` | `preparing`, `shipped`, `at_lab`, `returned` |
| `tracking_number` | `text` | nullable | |
| `notes` | `text` | nullable | |
| `created_at` | `timestamptz` | default `now()` | |

---

### `lab_order_rolls` (join table)

Many rolls can be in one lab order.

| Column | Type | Constraints |
|--------|------|-------------|
| `lab_order_id` | `uuid` | NOT NULL, REFERENCES `lab_orders(id)` ON DELETE CASCADE |
| `roll_id` | `uuid` | NOT NULL, REFERENCES `rolls(id)` ON DELETE CASCADE |
| PRIMARY KEY | | `(lab_order_id, roll_id)` |

---

## Local JS Constants (no database table)

### Chemistry Presets

```js
export const CHEMISTRY_PRESETS = [
  {
    id: 'hc110-b',
    name: 'HC-110 Dil. B',
    dilution: '1+31',
    temp_f: 68,
    dev_time_seconds: 420,      // 7 min
    agitation: 'continuous first 30s, then 4 inversions every 30s',
  },
  {
    id: 'd76-stock',
    name: 'D-76 (stock)',
    dilution: 'undiluted',
    temp_f: 68,
    dev_time_seconds: 480,      // 8 min (Kodak Tri-X 400 baseline)
    agitation: 'continuous first 60s, then 4 inversions every 30s',
  },
  {
    id: 'rodinal-50',
    name: 'Rodinal 1+50',
    dilution: '1+50',
    temp_f: 68,
    dev_time_seconds: 780,      // 13 min
    agitation: 'continuous first 60s, then 4 inversions every 60s',
  },
  {
    id: 'ilfosol3',
    name: 'Ilfosol 3',
    dilution: '1+9',
    temp_f: 68,
    dev_time_seconds: 420,      // 7 min
    agitation: 'continuous first 30s, then 4 inversions every 30s',
  },
  {
    id: 'id11-stock',
    name: 'ID-11 (stock)',
    dilution: 'undiluted',
    temp_f: 68,
    dev_time_seconds: 480,      // 8 min
    agitation: 'continuous first 60s, then 4 inversions every 30s',
  },
  {
    id: 'xtol-stock',
    name: 'XTOL (stock)',
    dilution: 'undiluted',
    temp_f: 68,
    dev_time_seconds: 480,      // 8 min
    agitation: 'continuous first 60s, then 4 inversions every 30s',
  },
];
```

### Dev Timer Steps

```js
export const DEV_STEPS = [
  { id: 'presoak',   label: 'Pre-soak',   duration_seconds: 120,  agitation: false },
  { id: 'developer', label: 'Developer',  duration_seconds: null, agitation: true  }, // duration set by chosen chemistry
  { id: 'stop',      label: 'Stop Bath',  duration_seconds: 60,   agitation: false },
  { id: 'fixer',     label: 'Fixer',      duration_seconds: 300,  agitation: false },
];
```

---

## Supabase Setup Notes

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL in `supabase/migrations/001_initial.sql` (to be created during build)
3. Set environment variables in `.env.local`:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
4. **Row Level Security:** Disabled for MVP (single user, no auth). Enable before Phase 2 launch.
5. **Realtime:** Not needed for MVP.

---

## Migration Order

When building out tables, create in this order to respect foreign key dependencies:

1. `rolls`
2. `frames`
3. `film_stocks` (Phase 2)
4. `cameras` (Phase 2)
5. `lab_orders` (Phase 2)
6. `lab_order_rolls` (Phase 2)

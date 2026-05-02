# Grain — Screen Specifications

All screens share:
- Background: `#1a1a18`
- Surface cards: `#2C2C2A`
- Accent: `#EF9F27` (amber)
- Text: `#F1EFE8`
- Max width: 430px, centered
- Mobile-first, single-column layout

---

## 1. Roll List (Home)

**Route:** `/`  
**Purpose:** Give the user an at-a-glance view of all their rolls and quick access to the active roll.

### Key UI Elements
- **Header bar:** "Grain" wordmark (left), roll count badge e.g. "12 rolls" (right)
- **Active roll card** (pinned at top, amber left border):
  - Film stock name (large)
  - Camera name + ISO
  - Frames shot out of total (e.g. "24 / 36")
  - Status badge (pill: In Camera / Shot / Developing / At Lab / Scanned)
  - Visual 36-frame grid — filled squares = shot, empty = remaining
- **"Recent Rolls" list** below the active card:
  - Each row: stock name, camera, date logged, status badge
  - Tapping any row navigates to Roll Detail
- **Floating "+" button** (amber, bottom-right corner) — opens the New Roll modal

### User Actions
| Action | Result |
|--------|--------|
| Tap active roll card | Navigate to `/roll/:id` |
| Tap any roll in list | Navigate to `/roll/:id` |
| Tap "+" button | Open New Roll modal/sheet |
| Scroll down | Load older rolls |

### Data Read
- All rolls from `rolls` table, ordered by `created_at DESC`
- Active roll = most recent roll with status `in_camera`
- Frame counts from `frames` table (count per roll_id)

### Data Write
- New roll inserted into `rolls` on form submit

---

## 2. New Roll Modal

**Trigger:** "+" button on Roll List  
**Type:** Bottom sheet / modal overlay  
**Purpose:** Log a new roll in under 30 seconds.

### Key UI Elements
- **Film stock** — text input with autocomplete from seeded stock list
- **Camera** — text input (free text in MVP)
- **ISO** — number input, defaults to selected stock's ISO if known
- **Push/Pull** — stepper: −2 / −1 / 0 / +1 / +2 / +3 (default 0)
- **Frame count** — toggle: 24 or 36 (default 36)
- **"Load Roll"** button (amber, full width)
- **Cancel** (text link at top)

### User Actions
| Action | Result |
|--------|--------|
| Submit form | Insert row into `rolls`, close modal, Roll List updates |
| Cancel | Close modal, no change |

### Data Write
- INSERT into `rolls` with all form fields, status defaults to `in_camera`

---

## 3. Roll Detail

**Route:** `/roll/:id`  
**Purpose:** Full control over a single roll — log frames, add notes, advance status, start development.

### Key UI Elements
- **Back button** (top-left) → Roll List
- **Roll header:** stock name, camera, ISO, push/pull badge (e.g. "+2")
- **Editable fields** (tap to edit inline):
  - Film stock, camera, ISO, push/pull stops
- **Frame grid** (6 × 6 for 36-frame rolls):
  - Filled amber square = shot
  - Empty square = unshot
  - Tap shot frame = opens frame note modal
  - Tap empty frame = marks as shot (adds frame record)
  - Frame count shown below grid: "18 / 36 frames"
- **Status pipeline** (horizontal steps with progress line):
  `In Camera → Shot → Developing → At Lab → Scanned`
  - Current step highlighted in amber
  - Tap next step to advance
- **"Start Dev Timer"** button (shown when status is `developing`)
- **Roll notes** — multi-line text area at the bottom

### User Actions
| Action | Result |
|--------|--------|
| Tap empty frame | Mark as shot, insert into `frames`, increment `frames_shot` on roll |
| Tap shot frame | Open Frame Note modal |
| Edit roll fields | PATCH `rolls` row on blur |
| Advance status | PATCH `rolls.status` |
| Tap "Start Dev Timer" | Navigate to `/timer?roll_id=:id` |
| Edit roll notes | PATCH `rolls.notes` on blur |

### Data Read
- Single roll from `rolls` by id
- All frames for roll from `frames` where `roll_id = :id`

### Data Write
- UPDATE `rolls` (status, notes, editable fields)
- INSERT / UPDATE `frames` (frame notes, shot_at)

---

## 4. Frame Note Modal

**Trigger:** Tapping a shot frame on Roll Detail  
**Type:** Small modal overlay  
**Purpose:** Add or edit a note for a specific frame.

### Key UI Elements
- Frame number heading: "Frame 14"
- Shot timestamp (read-only)
- Text area: "Note" (placeholder: "What did you shoot?")
- "Save" button
- "Mark as unshot" text link (destructive — removes the frame record)
- "Cancel" text link

### Data Write
- UPDATE `frames.note` on save
- DELETE frame record on "Mark as unshot"

---

## 5. Dev Timer

**Route:** `/timer` (optionally `/timer?roll_id=:id`)  
**Purpose:** Guide the user through each step of film development with timed countdowns and agitation reminders.

### Key UI Elements
- **Chemistry selector** — horizontal scroll list of preset chips:
  HC-110 Dil.B · D-76 · Rodinal 1+50 · Ilfosol 3 · ID-11 · XTOL
- **Temperature note:** "Times shown for 68°F / 20°C"
- **Step pipeline** (top of screen):
  `Pre-soak → Developer → Stop Bath → Fixer`
  Active step highlighted
- **Large countdown display** — MM:SS, amber colour, fills most of the screen
- **Current step label** below the timer
- **Agitation banner** — slides down during developer step every 30 seconds:
  "Agitate now — 4 inversions" with amber background. Auto-dismisses after 5 seconds.
- **Control buttons:**
  - "Pause / Resume" (secondary style)
  - "Next Step →" (amber, advances pipeline)
- **Completion screen** — when all steps done: "Development complete 🎞" with option to mark roll as Scanned

### User Actions
| Action | Result |
|--------|--------|
| Select chemistry | Update dev time for Developer step |
| Start timer | Begin countdown for first step (Pre-soak) |
| Pause | Freeze countdown |
| Resume | Continue countdown |
| Next Step | Advance to next step, reset countdown |
| Complete all steps | Show completion screen |
| Mark roll as scanned | PATCH `rolls.status` to `scanned`, navigate to Roll Detail |

### Data Read
- `CHEMISTRY_PRESETS` (local constant)
- `DEV_STEPS` (local constant)
- Optional: roll info if `roll_id` param present

### Data Write
- Optional: UPDATE `rolls.status` to `scanned` at completion

### Notes
- Timer must continue if the user locks their screen (use Web Audio API or Page Visibility API)
- Agitation alert should vibrate the device if Vibration API is available
- Timer state is stored in localStorage so a page refresh doesn't lose progress

---

## 6. Film Stock Library

**Route:** `/stocks`  
**Purpose:** Browse known film stocks. Read-only in MVP.

### Key UI Elements
- Search bar at top
- Filter chips: All · Color · B&W · Slide · Discontinued
- Stock list:
  - Each row: stock name, brand, ISO, type badge
  - Tapping a stock navigates to Stock Detail

### User Actions
| Action | Result |
|--------|--------|
| Search | Filter list by name/brand |
| Filter chip | Filter by stock type |
| Tap stock | Navigate to `/stocks/:id` |

### Data Read
- Local JS constant `FILM_STOCKS` (MVP) — ~30 common stocks

---

## 7. Stock Detail

**Route:** `/stocks/:id`  
**Purpose:** View all info about a specific film stock.

### Key UI Elements
- Back button
- Stock name + brand
- ISO, format (35mm / 120), type
- Character notes (short description of the stock's look)
- "Discontinued" badge if applicable
- List of user's rolls shot on this stock (links to Roll Detail)

### Data Read
- `FILM_STOCKS` local constant for stock info
- `rolls` filtered by `film_stock` name for user's history

---

## 8. Camera Collection *(Phase 2)*

**Route:** `/cameras`  
**Purpose:** Track the user's cameras and which roll is currently loaded in each.

### Key UI Elements
- Camera list:
  - Name, format, current roll (stock name + frames shot)
  - "Empty" state if no roll loaded
- "Add Camera" button
- Tap camera → Camera Detail

### Data Read / Write
- `cameras` table

---

## 9. Lab Tracker *(Phase 2)*

**Route:** `/lab`  
**Purpose:** Track mail-in development orders.

### Key UI Elements
- List of lab orders with lab name, date shipped, status badge
- "New Order" button
- Order detail: rolls included, tracking number, timeline of status changes

### Data Read / Write
- `lab_orders` + `lab_order_rolls` tables

---

## 10. Settings

**Route:** `/settings`  
**Purpose:** App preferences.

### Key UI Elements (MVP)
- Default frame count (24 / 36)
- Default ISO
- Temperature unit (°F / °C)
- "Clear all data" (destructive, with confirmation)
- App version number

### Data Read / Write
- `localStorage` for preferences

---

## Navigation Structure

```
/                    Roll List (home)
/roll/:id            Roll Detail
/timer               Dev Timer
/stocks              Film Stock Library
/stocks/:id          Stock Detail
/cameras             Camera Collection  [Phase 2]
/lab                 Lab Tracker        [Phase 2]
/settings            Settings
```

Bottom navigation bar (MVP — 3 items):
- 🎞 Rolls (/)
- ⏱ Timer (/timer)
- ⚙ Settings (/settings)

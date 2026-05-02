# FieldNotes — Replit Agent Build Prompt

> Paste everything below the horizontal rule directly into the Replit Agent chat.

---

Build a mobile-first PWA called **FieldNotes** — a job management app for self-employed tradespeople (solo electricians, plumbers, builders). The app lets them log jobs, track materials, build quotes, and export professional PDFs, entirely offline if needed.

---

## Tech Stack

- **React 18** + **Vite** + **React Router v6**
- **Tailwind CSS** (dark theme, custom colours via CSS variables)
- **Supabase** for auth + cloud database (graceful fallback to localStorage if not configured)
- **jsPDF** for client-side PDF generation
- **PWA**: `public/manifest.json` + Apple PWA meta tags in `index.html`

---

## Colour Palette (CSS variables in `index.css`)

```css
:root {
  --color-primary: #111827;    /* near-black background */
  --color-surface: #1f2937;    /* card / modal background */
  --color-border: #374151;     /* subtle borders */
  --color-text: #f9fafb;       /* primary text */
  --color-text-muted: #9ca3af; /* secondary text */
  --color-accent: #f59e0b;     /* amber — action colour */
  --color-success: #10b981;    /* green — paid / done */
  --color-danger: #ef4444;     /* red — danger zone */
}
```

Apply these via Tailwind's `bg-[var(--color-primary)]` pattern or extend the Tailwind config.

---

## App Structure

```
src/
  lib/
    supabase.js
    localStorage.js
    dataService.js
    pdfGenerator.js
  hooks/
    useAuth.js
  pages/
    Onboarding.jsx
    Auth.jsx
    JobList.jsx
    JobDetail.jsx
    QuoteBuilder.jsx
    Settings.jsx
  components/
    BottomNav.jsx
    Icons.jsx
  App.jsx
  main.jsx
  index.css
public/
  manifest.json
supabase/
  migrations/
    001_initial.sql
    002_auth_rls.sql
index.html
```

---

## Data Models

### localStorage keys
- `fn_jobs` — array of job objects
- `fn_materials` — array of material objects
- `fn_quotes` — array of quote objects
- `fn_settings` — single settings object
- `fn_onboarded` — boolean string

### Job object shape
```js
{
  id: string (uuid),
  client_name: string,
  address: string,
  phone: string,
  email: string,
  job_type: 'residential' | 'commercial' | 'emergency',
  status: 'quote' | 'active' | 'done' | 'invoiced' | 'paid',
  description: string,
  labour_notes: string,
  internal_notes: string,
  created_at: ISO string,
  updated_at: ISO string,
}
```

### Material object shape
```js
{
  id: string (uuid),
  job_id: string,
  name: string,
  cost: number,
  quantity: number,
}
```

### Quote object shape
```js
{
  id: string (uuid),
  job_id: string,
  reference: string,     // FN-001, FN-002...
  status: 'draft' | 'sent' | 'accepted' | 'declined',
  labour_items: [{ description: string, hours: number, rate: number }],
  vat_rate: 0 | 5 | 20,
  subtotal: number,
  vat_amount: number,
  total: number,
  valid_until: string,   // ISO date
  notes: string,
  created_at: ISO string,
}
```

---

## File-by-file Instructions

### `src/lib/supabase.js`
```js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : { from: () => ({ select: () => ({ data: null, error: new Error('not configured') }) }) }
```

### `src/lib/localStorage.js`
Synchronous CRUD functions. Every function is exported individually.

```js
// Helpers
function load(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}
function uuid() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
}

// Jobs
export function getJobs() { return load('fn_jobs') }
export function saveJobs(jobs) { save('fn_jobs', jobs) }
export function getJobById(id) { return getJobs().find(j => j.id === id) ?? null }
export function createJob(data) {
  const job = { id: uuid(), ...data, status: data.status ?? 'quote', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  saveJobs([job, ...getJobs()])
  return job
}
export function updateJob(id, updates) {
  const jobs = getJobs().map(j => j.id === id ? { ...j, ...updates, updated_at: new Date().toISOString() } : j)
  saveJobs(jobs)
  return jobs.find(j => j.id === id) ?? null
}
export function deleteJob(id) { saveJobs(getJobs().filter(j => j.id !== id)) }

// Materials
export function getMaterials(jobId) { return load('fn_materials').filter(m => m.job_id === jobId) }
export function saveMaterials(all) { save('fn_materials', all) }
export function addMaterial(jobId, data) {
  const m = { id: uuid(), job_id: jobId, ...data }
  save('fn_materials', [m, ...load('fn_materials')])
  return m
}
export function updateMaterial(id, updates) {
  const all = load('fn_materials').map(m => m.id === id ? { ...m, ...updates } : m)
  save('fn_materials', all)
}
export function deleteMaterial(id) { save('fn_materials', load('fn_materials').filter(m => m.id !== id)) }

// Quotes
export function getQuotes(jobId) { return load('fn_quotes').filter(q => q.job_id === jobId) }
export function getAllQuotes() { return load('fn_quotes') }
export function saveQuotes(quotes) { save('fn_quotes', quotes) }
export function getNextQuoteRef() {
  const all = load('fn_quotes')
  return `FN-${String(all.length + 1).padStart(3, '0')}`
}
export function createQuote(data) {
  const q = { id: uuid(), ...data, reference: data.reference ?? getNextQuoteRef(), created_at: new Date().toISOString() }
  save('fn_quotes', [q, ...load('fn_quotes')])
  return q
}
export function updateQuote(id, updates) {
  const all = load('fn_quotes').map(q => q.id === id ? { ...q, ...updates } : q)
  save('fn_quotes', all)
  return all.find(q => q.id === id) ?? null
}
export function deleteQuote(id) { save('fn_quotes', load('fn_quotes').filter(q => q.id !== id)) }

// Settings
export function getSettings() { return load('fn_settings', {}) }
export function saveSettings(s) { save('fn_settings', s) }
```

### `src/lib/dataService.js`
Async unified layer — same pattern as Grain's dataService. Every exported function tries Supabase first, mirrors to localStorage, falls back on error. Export: `getJobs`, `getJobById`, `createJob`, `updateJob`, `deleteJob`, `getMaterials`, `addMaterial`, `updateMaterial`, `deleteMaterial`, `getQuotes`, `createQuote`, `updateQuote`.

The Supabase tables match the localStorage keys (jobs, materials, quotes). On reads, mirror the result back to localStorage. On writes, write localStorage first (optimistic), then sync to Supabase.

### `src/lib/pdfGenerator.js`
Uses **jsPDF** (install: `npm install jspdf`).

```js
import jsPDF from 'jspdf'

export function generateQuotePDF(quote, job, settings) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = 210
  const margin = 20
  let y = margin

  // Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(settings.companyName || 'FieldNotes', margin, y)
  y += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100)
  if (settings.traderName) { doc.text(settings.traderName, margin, y); y += 5 }
  if (settings.phone) { doc.text(settings.phone, margin, y); y += 5 }
  if (settings.email) { doc.text(settings.email, margin, y); y += 5 }
  doc.setTextColor(0)

  // Quote ref + date top right
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(`QUOTE ${quote.reference}`, pageW - margin, margin, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Date: ${new Date(quote.created_at).toLocaleDateString('en-GB')}`, pageW - margin, margin + 7, { align: 'right' })
  if (quote.valid_until) {
    doc.text(`Valid until: ${new Date(quote.valid_until).toLocaleDateString('en-GB')}`, pageW - margin, margin + 12, { align: 'right' })
  }

  y += 10

  // Divider
  doc.setDrawColor(200)
  doc.line(margin, y, pageW - margin, y)
  y += 8

  // Client info
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Bill To:', margin, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.text(job.client_name || '', margin, y); y += 5
  if (job.address) { doc.text(job.address, margin, y); y += 5 }
  if (job.phone) { doc.text(job.phone, margin, y); y += 5 }
  y += 5

  // Job description
  if (job.description) {
    doc.setFont('helvetica', 'bold')
    doc.text('Scope of Work:', margin, y); y += 5
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(job.description, pageW - margin * 2)
    doc.text(lines, margin, y)
    y += lines.length * 5 + 5
  }

  // Line items
  doc.setFont('helvetica', 'bold')
  doc.text('Description', margin, y)
  doc.text('Qty', 120, y, { align: 'right' })
  doc.text('Rate', 150, y, { align: 'right' })
  doc.text('Amount', pageW - margin, y, { align: 'right' })
  y += 3
  doc.line(margin, y, pageW - margin, y)
  y += 5
  doc.setFont('helvetica', 'normal')

  // Labour items
  ;(quote.labour_items || []).forEach(item => {
    const amount = (item.hours * item.rate).toFixed(2)
    doc.text(item.description || 'Labour', margin, y)
    doc.text(String(item.hours), 120, y, { align: 'right' })
    doc.text(`£${Number(item.rate).toFixed(2)}/hr`, 150, y, { align: 'right' })
    doc.text(`£${amount}`, pageW - margin, y, { align: 'right' })
    y += 6
  })

  // Material items (from job)
  // (caller can pass materials array as optional 4th param)

  y += 3
  doc.line(margin, y, pageW - margin, y)
  y += 5

  // Totals
  const subtotalLine = (label, value) => {
    doc.text(label, 150, y, { align: 'right' })
    doc.text(`£${Number(value).toFixed(2)}`, pageW - margin, y, { align: 'right' })
    y += 6
  }
  subtotalLine('Subtotal:', quote.subtotal)
  if (quote.vat_rate > 0) subtotalLine(`VAT (${quote.vat_rate}%):`, quote.vat_amount)
  doc.setFont('helvetica', 'bold')
  subtotalLine('TOTAL:', quote.total)

  // Notes
  if (quote.notes) {
    y += 6
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(100)
    const noteLines = doc.splitTextToSize(`Notes: ${quote.notes}`, pageW - margin * 2)
    doc.text(noteLines, margin, y)
  }

  return doc
}
```

### `src/hooks/useAuth.js`
```js
import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export default function useAuth() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  const signOut = () => isSupabaseConfigured && supabase.auth.signOut()
  return { session, user: session?.user ?? null, loading, signOut }
}
```

---

## Page Specifications

### `src/pages/Onboarding.jsx`
First-launch screen shown once (check `fn_onboarded` in localStorage).

- Dark background, FieldNotes wordmark at top
- Three feature callouts with icons: "Log jobs fast", "Build quotes in seconds", "Export professional PDFs"
- Big "Get Started" CTA button (amber)
- On CTA tap: set `fn_onboarded = true`, navigate to `/auth`

### `src/pages/Auth.jsx`
Magic link login. If Supabase not configured, show a "Supabase not connected" notice and a "Continue without account" button that skips to `/`.

- Email input + "Send Magic Link" button
- After send: success state "Check your email"
- Error handling (invalid email, rate limit, etc.)
- Link: "Continue without signing in → use app offline only"

### `src/pages/JobList.jsx`
Main screen. Shows all jobs sorted by `updated_at` descending.

**Layout:**
```
FIELDNOTES                           [X jobs]
Job Notes

[All] [Quote] [Active] [Done] [Invoiced] [Paid]   ← status filter tabs

──────────────── Job Cards ────────────────

[CLIENT NAME              IN PROGRESS →]
[Address · Job type]
[Updated 2h ago]

──────────────────────────────────────────

[FAB: + ]  (fixed, bottom-right, above bottom nav)
```

**Job card:**
- Client name (bold)
- Address + job type (muted)
- Status badge (coloured pill)
- "Updated X ago" (relative time)
- Tap → navigate to `/job/:id`

**Status badge colours:**
- quote → amber
- active → blue
- done → green
- invoiced → purple
- paid → success green

**Empty state:** dashed border box, "No jobs yet. Tap + to add your first job."

**New Job modal (triggered by FAB):**
- Client name (required)
- Address
- Phone
- Job type (3 buttons: Residential / Commercial / Emergency)
- Description (optional)
- "Create Job" button
- On submit: createJob() → navigate to `/job/:id`

### `src/pages/JobDetail.jsx`
Full job editor. Loads job by `id` param.

**Sticky header:** ← back | [STATUS DROPDOWN] (right-aligned, amber text)

**Sections:**

1. **Client info** — editable inline: name, address, phone, email. Each field taps to edit (no edit mode toggle needed — just auto-save on blur).

2. **Status pipeline** — horizontal scrollable pill buttons (same as Grain's status pipeline). Tap a pill to advance status.

3. **Job type** — 3-button toggle: Residential / Commercial / Emergency

4. **Description** — auto-resizing textarea, saves on blur

5. **Materials** — list of material cards (name, qty × cost = line total). "Add Material" button opens inline form (name, qty, cost). Swipe to delete or tap a material to edit inline. Running total shown.

6. **Labour Notes** — free text textarea

7. **Internal Notes** — free text textarea (labelled "Private — not shown on quotes")

8. **Quotes section** — list of quotes for this job. Each shows reference, total, status badge. "New Quote" button → navigate to `/quote/new?jobId=:id`

9. **Dev Timer Link** (same concept as Grain) — "Start Development" style link, here it's "Build Quote →" linking to QuoteBuilder

10. **Danger zone** — "Archive Job" (soft delete, sets status to 'archived') and "Delete Job" (hard delete with confirm)

**Auto-save:** debounce 800ms on all text fields — save silently.

### `src/pages/QuoteBuilder.jsx`
Route: `/quote/:id` (edit existing) or `/quote/new?jobId=:jobId` (create new).

**Layout:**
```
← [JOB NAME]                    QUOTE FN-001

Labour
──────────────────────────────────
[+ Add Labour Item]

  [Electrical survey · 2 hrs × £65/hr = £130]  [×]
  [First fix · 4 hrs × £65/hr = £260]          [×]

Materials (from job)
──────────────────────────────────
  [20m 2.5mm T&E · 1 × £18 = £18]
  [Consumer unit · 1 × £120 = £120]

──────────────────────────────────
                   Subtotal: £528
                   VAT (20%): £105.60
                   TOTAL:     £633.60

Quote Settings
──────────────────────────────────
  Valid until: [date picker]
  VAT rate: [0%] [5%] [20%]
  Status: Draft / Sent / Accepted / Declined
  Notes: [textarea]

[Generate PDF]    [Save Quote]
```

**Add Labour Item form (inline, expands on + tap):**
- Description (text)
- Hours (number stepper)
- Rate (number, pre-filled from settings.defaultDayRate / 8)
- Auto-calculates amount

**Totals:** auto-calculate whenever items change. Subtotal = labour + materials. VAT applied on top.

**"Generate PDF" button:** calls `generateQuotePDF(quote, job, settings)` from pdfGenerator.js, then `doc.save('quote-FN-001.pdf')` — triggers browser download, and uses `navigator.share` API on mobile if available.

**"Save Quote" button:** upserts quote to dataService, navigates back to job detail.

### `src/pages/Settings.jsx`
- **Profile section:** Trader name, company name, phone, email (used in PDF header)
- **Defaults section:** Default hourly rate (number input), VAT registered toggle, Currency selector (GBP / EUR / USD)
- **Account section:** Shows signed-in email + Sign Out button (or "Not signed in" if offline only)
- **About section:** App name, version, GitHub link
- **Danger zone:** "Clear All Data" button with confirmation

### `src/components/BottomNav.jsx`
Fixed bottom nav, 3 tabs:
- Jobs (briefcase icon) → `/`
- Quotes (document icon) → `/quotes` (a flat list of all quotes across all jobs — Phase 2 can be a stub "coming soon")
- Settings (gear icon) → `/settings`

Active tab: amber fill icon. Inactive: muted.
Hidden on `/onboarding` and `/auth` routes.
Max width 430px, centred.

### `src/components/Icons.jsx`
Inline SVG components. Need: BriefcaseIcon, DocumentIcon, GearIcon, PlusIcon, CloseIcon, ArrowLeftIcon, ArrowRightIcon, CheckIcon, TrashIcon, PencilIcon, ChevronDownIcon.

---

## App.jsx — Routing + Auth Gate

```
/ (Onboarding) → if not onboarded
/ (Auth) → if onboarded but not signed in (and Supabase configured)
/ → JobList (default landing)
/job/:id → JobDetail
/quote/new → QuoteBuilder (create)
/quote/:id → QuoteBuilder (edit)
/settings → Settings
```

Auth gate logic: check `fn_onboarded`. If not set → onboarding. Else if Supabase configured and no session → auth screen. Else → app routes.

Show amber spinner while session loads.

---

## Supabase Migration Files

### `supabase/migrations/001_initial.sql`
```sql
-- Jobs
create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  client_name text not null default '',
  address text not null default '',
  phone text not null default '',
  email text not null default '',
  job_type text not null default 'residential',
  status text not null default 'quote',
  description text not null default '',
  labour_notes text not null default '',
  internal_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Materials
create table if not exists materials (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete cascade,
  name text not null default '',
  cost numeric not null default 0,
  quantity numeric not null default 1,
  created_at timestamptz not null default now()
);

-- Quotes
create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  reference text not null default '',
  status text not null default 'draft',
  labour_items jsonb not null default '[]',
  vat_rate numeric not null default 20,
  subtotal numeric not null default 0,
  vat_amount numeric not null default 0,
  total numeric not null default 0,
  valid_until date,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists jobs_user_id_idx on jobs(user_id);
create index if not exists materials_job_id_idx on materials(job_id);
create index if not exists quotes_job_id_idx on quotes(job_id);
```

### `supabase/migrations/002_auth_rls.sql`
```sql
-- Enable RLS
alter table jobs enable row level security;
alter table materials enable row level security;
alter table quotes enable row level security;

-- Jobs policies
create policy "Users can read own jobs" on jobs for select using (auth.uid() = user_id);
create policy "Users can insert own jobs" on jobs for insert with check (auth.uid() = user_id);
create policy "Users can update own jobs" on jobs for update using (auth.uid() = user_id);
create policy "Users can delete own jobs" on jobs for delete using (auth.uid() = user_id);

-- Materials policies (via job ownership)
create policy "Users can read own materials" on materials for select
  using (exists (select 1 from jobs where jobs.id = materials.job_id and jobs.user_id = auth.uid()));
create policy "Users can insert own materials" on materials for insert
  with check (exists (select 1 from jobs where jobs.id = materials.job_id and jobs.user_id = auth.uid()));
create policy "Users can update own materials" on materials for update
  using (exists (select 1 from jobs where jobs.id = materials.job_id and jobs.user_id = auth.uid()));
create policy "Users can delete own materials" on materials for delete
  using (exists (select 1 from jobs where jobs.id = materials.job_id and jobs.user_id = auth.uid()));

-- Quotes policies
create policy "Users can read own quotes" on quotes for select using (auth.uid() = user_id);
create policy "Users can insert own quotes" on quotes for insert with check (auth.uid() = user_id);
create policy "Users can update own quotes" on quotes for update using (auth.uid() = user_id);
create policy "Users can delete own quotes" on quotes for delete using (auth.uid() = user_id);
```

---

## PWA Setup

### `public/manifest.json`
```json
{
  "name": "FieldNotes",
  "short_name": "FieldNotes",
  "description": "Job management for tradespeople",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#111827",
  "theme_color": "#f59e0b",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### `index.html` additions
```html
<meta name="theme-color" content="#f59e0b" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="FieldNotes" />
<link rel="apple-touch-icon" href="/icon-192.png" />
<link rel="manifest" href="/manifest.json" />
```

---

## Packages to Install

```
npm install @supabase/supabase-js react-router-dom jspdf
```

---

## Key UX Requirements

1. **No spinning loaders on data actions** — localStorage is synchronous and instant. Only show loading on initial app mount.
2. **Auto-save text fields** — debounce 800ms, no "Save" button needed for notes/description.
3. **Large touch targets** — minimum 48×48px for all interactive elements.
4. **Status badge colours** must be consistent everywhere (job list, job detail, quote list).
5. **FAB position** — `fixed bottom-20 right-6` to stay above the bottom nav.
6. **PDF download on mobile** — use `navigator.share({ files: [pdfBlob] })` if available, otherwise `doc.save()` for desktop fallback.
7. **Numbers in quotes** — always show 2 decimal places, use `toFixed(2)`.
8. **Empty states** — every list screen must have a clear empty state with a CTA.

---

## What NOT to build in this MVP

- Invoice generation (Phase 2)
- Time tracker (Phase 2)
- Photo uploads (Phase 2)
- Push notifications (Phase 2)
- Payment tracking (Phase 2)
- Stripe integration (Phase 3)
- Multi-user / team features (Phase 3)

---

Build the complete app with all files populated. The app must run in Replit with `npm run dev` and be deployable to the Replit live URL. Use Supabase env vars `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` — if absent, the app must still work fully using localStorage only.

# FieldNotes — Product Requirements Document

**Version:** 1.0  
**Date:** 2026-05-02  
**Status:** Pre-build

---

## Overview

FieldNotes is a mobile-first job management app for self-employed tradespeople. It replaces paper notebooks, WhatsApp voice notes, and spreadsheet invoices with a single offline-first app that fits in a work jacket pocket.

**MVP target user:** Solo electricians (UK market first)  
**Platform:** PWA (installable on iPhone / Android home screen)  
**Stack:** React + Vite + Tailwind CSS + Supabase

---

## Problem Statement

Solo tradespeople lose money every week because their admin tools don't match how they work:

1. **Job details are scattered** — notes in a notebook, photos on the phone, verbal agreements they forgot.
2. **Quoting is slow** — most electricians write quotes on paper or in Notes.app, can't track which quotes were accepted.
3. **Invoicing is manual** — WhatsApp a screenshot or email a PDF they made in Word.
4. **Nothing works offline** — all the real work happens in buildings with no signal.
5. **Enterprise apps are too complex** — Tradify, ServiceM8, Jobber are built for companies, not sole traders. They have more buttons than a circuit board and cost £40–80/month.

---

## Target User

**Primary: "Dave" — solo electrician, self-employed, 5–20 years experience**

- Works alone or with one apprentice
- Annual revenue: £45,000–£90,000
- Does domestic + light commercial work
- Uses phone for everything, hates typing on it
- Pain: loses time doing admin at 9pm when he should be with family
- Has tried Xero / QuickBooks — abandoned within a month
- Pays £0–£10/month on work software currently
- Would pay £9/month if the app clearly saves him an hour a week

**Secondary (Phase 2):** Plumbers, HVAC engineers, builders, handymen

---

## MVP Features (Phase 1)

### Module 1 — Job List
- List of all jobs, sorted by most recent activity
- Each card shows: client name, address, status badge, last updated
- Status pipeline: `Quote` → `Active` → `Done` → `Invoiced` → `Paid`
- Filter by status (tab bar above list)
- FAB to add a new job
- Empty state with clear CTA

### Module 2 — Job Detail
- Client name, address, phone number, email (optional)
- Job type (Residential / Commercial / Emergency)
- Description / scope of work (free text)
- Status selector (same pipeline as above)
- Materials list — add line items (name + cost) on the fly
- Labour notes — free text field
- Job photos — attach up to 10 photos per job
- Internal notes — private notes not visible on quotes/invoices
- Created date, last updated date

### Module 3 — Quote Builder
- Pull from Job Detail (client, description, materials list)
- Add labour line items (hours × rate)
- Set VAT (20% / 5% / 0%)
- Quote total auto-calculated
- Quote reference number (auto-generated: FN-001, FN-002…)
- Valid until date
- Send as PDF via native share sheet (no email integration in MVP)
- Quote status: Draft / Sent / Accepted / Declined

### Module 4 — Settings
- Tradesperson name & company name
- Logo upload (used on PDF header)
- Default day rate
- VAT registration status (toggle)
- Currency (£ / € / $)
- Clear All Data (danger zone)
- About section with version number

---

## Data Model

### `jobs` table
```
id            uuid PK
user_id       uuid FK (auth.uid)
client_name   text
address       text
phone         text
email         text
job_type      text ('residential' | 'commercial' | 'emergency')
status        text ('quote' | 'active' | 'done' | 'invoiced' | 'paid')
description   text
labour_notes  text
internal_notes text
created_at    timestamptz
updated_at    timestamptz
```

### `materials` table
```
id            uuid PK
job_id        uuid FK (jobs.id, cascade delete)
name          text
cost          numeric
quantity      numeric (default 1)
created_at    timestamptz
```

### `quotes` table
```
id            uuid PK
job_id        uuid FK (jobs.id)
user_id       uuid FK (auth.uid)
reference     text (FN-001, FN-002…)
status        text ('draft' | 'sent' | 'accepted' | 'declined')
labour_items  jsonb  (array of {description, hours, rate})
vat_rate      numeric (0 | 5 | 20)
subtotal      numeric
vat_amount    numeric
total         numeric
valid_until   date
notes         text
created_at    timestamptz
```

### Local-only constants (no DB table)
- Job type labels + colours
- Status pipeline labels + colours
- VAT rate options

---

## Architecture

Same pattern as Grain:

- **Offline-first**: localStorage as primary data store, Supabase as cloud sync
- **dataService.js**: unified async layer — write to localStorage first, sync to Supabase, fall back on error
- **Auth**: Supabase magic link (signInWithOtp)
- **RLS**: all tables filtered by auth.uid()
- **PDF generation**: client-side with jsPDF (no server needed)
- **Photo storage**: Supabase Storage bucket (Phase 1 can use base64 in localStorage for simplicity)

### Key files
```
src/
  lib/
    supabase.js          — client + isConfigured flag
    localStorage.js      — sync CRUD for jobs, materials, quotes
    dataService.js       — async unified layer
    pdfGenerator.js      — quote PDF builder (jsPDF)
  hooks/
    useAuth.js           — session management
  pages/
    JobList.jsx          — main screen
    JobDetail.jsx        — job editor
    QuoteBuilder.jsx     — quote screen
    Settings.jsx         — settings screen
    Auth.jsx             — magic link login
    Onboarding.jsx       — first launch screen
  components/
    BottomNav.jsx        — 3-tab nav (Jobs · Quotes · Settings)
    Icons.jsx            — inline SVG icons
public/
  manifest.json          — PWA manifest
supabase/
  migrations/
    001_initial.sql      — jobs, materials, quotes tables
    002_auth_rls.sql     — RLS policies
```

---

## Design Principles

1. **Works offline first** — every feature must function with no internet
2. **Tap-not-type** — prefer toggles, steppers, and pickers over text input where possible
3. **Fast to add a job** — new job to first note in under 30 seconds
4. **Trade-appropriate aesthetic** — dark theme, strong contrast, large touch targets (48px+), works with dirty or gloved hands
5. **No learning curve** — new user must understand every screen without a tutorial
6. **PDF looks professional** — the output (quote/invoice) must look better than a handwritten quote

---

## Monetisation

| Tier | Price | Limits |
|------|-------|--------|
| Free | £0/month | Up to 10 active jobs, quotes with FieldNotes watermark |
| Solo | £9/month | Unlimited jobs, no watermark, cloud backup, PDF export |
| Team (Phase 2) | £25/month | Up to 5 users, shared job pool, job assignment |

**Annual discount:** 2 months free (Solo: £90/year)

**Payment (Phase 2):** Stripe Billing with Supabase webhook to set a `pro_until` timestamp on the user record.

---

## MVP Screen List

1. Onboarding (first launch, sets up name + day rate)
2. Auth (magic link login)
3. Job List (with status tabs + FAB)
4. Job Detail (full editor — client, materials, notes, status)
5. Quote Builder (line items, VAT, total, PDF preview)
6. Settings (profile, defaults, danger zone)

---

## Phase 2 Roadmap

- Invoice builder (converts accepted quote → invoice, adds payment due date)
- Job photos (camera capture → Supabase Storage)
- Time tracker (start/stop timer per job, auto-calculates labour cost)
- Payment tracking (mark invoice as paid, outstanding balance view)
- Client address book (reuse client details across multiple jobs)
- Push notifications (quote follow-up reminders)
- Stripe payments (pay invoice via link in PDF)

## Phase 3 Roadmap

- Team accounts (job assignment, shared job pool)
- Xero / QuickBooks integration (export invoices)
- HMRC Making Tax Digital integration (self-assessment friendly reports)
- Community trade rates (anonymised hourly rate benchmarks by trade + region)

---

## Success Metrics

| Metric | Target at 90 days |
|--------|-----------------|
| Registered users | 200 |
| Active users (used in last 7 days) | 80 |
| Jobs created | 500+ |
| Quotes generated | 150+ |
| Solo tier conversion | 15% of active users |
| App Store rating | 4.5+ |

---

## Constraints

- Must work on iPhone 12 and newer (iOS 16+)
- Must work on Android 10+
- PDF must render correctly on all modern browsers
- App must be installable as PWA (no App Store submission required in MVP)
- All data encrypted at rest (Supabase handles this)
- GDPR compliant — users can export and delete all their data

---

**GitHub repo:** https://github.com/perzival-22/FieldNotes  
**Supabase project:** TBD  
**Live URL:** TBD (Replit deployment)

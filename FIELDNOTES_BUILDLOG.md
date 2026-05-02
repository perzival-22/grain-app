# FieldNotes build log

---

## 2026-05-02 — Planning (Claude Cowork)

### Documents created
- `FIELDNOTES_PRD.md` — Full product requirements document
- `FIELDNOTES_BUILD_PROMPT.md` — Replit Agent build prompt
- `FIELDNOTES_BUILDLOG.md` — This file

### App concept
Field notes for self-employed tradespeople. Target user: solo electricians (UK).
Core modules: Job List, Job Detail, Quote Builder, Settings.
Stack: React + Vite + Tailwind + Supabase, offline-first (localStorage fallback).

---

## Current state (pre-build)

**Pending (start here):**
1. **Paste build prompt into Replit Agent** — use `FIELDNOTES_BUILD_PROMPT.md`
2. **Connect GitHub repo** — https://github.com/perzival-22/FieldNotes (already created)
3. **Create Supabase project** for FieldNotes (new project, separate from Grain)
4. **Run migrations** — paste `001_initial.sql` then `002_auth_rls.sql` into Supabase SQL editor
5. **Add env vars to Replit** — `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
6. **Set Supabase Site URL** → to Replit live URL after first deploy
7. **Set Supabase redirect URL** → to Replit live URL
8. **Test offline mode** — app must work with no env vars
9. **Deploy and test magic link auth**
10. **(Optional) Set up Resend SMTP** — avoids 4/hr email rate limit

---

## Phase 2 — when ready to continue

- Invoice builder (convert accepted quote → invoice)
- Job photos (camera → Supabase Storage)
- Time tracker (start/stop per job)
- Payment tracking (mark invoice as paid)
- Client address book
- Push notifications (quote follow-up reminders)

## Phase 3

- Team accounts
- Stripe payments (pay via link in PDF)
- Xero / QuickBooks integration
- HMRC Making Tax Digital

---

**GitHub repo:** https://github.com/perzival-22/FieldNotes  
**Supabase project:** TBD  
**Live URL:** TBD (Replit deployment)

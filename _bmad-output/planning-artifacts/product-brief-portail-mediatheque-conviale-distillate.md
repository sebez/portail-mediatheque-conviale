---
title: "Product Brief Distillate: portail-mediatheque-conviale"
type: llm-distillate
source: "product-brief-portail-mediatheque-conviale.md"
created: "2026-04-11"
purpose: "Token-efficient context for downstream PRD creation"
---

# Product Brief Distillate — Portail Médiathèque Conviviale

## Core Identity

- **What it is:** Public web portal for a physical corporate book catalog (~60 books) at a French ESN
- **Owner/animator:** Sezratty — sole library curator, primary admin, the product champion
- **Primary goal:** Discovery → footfall. Not a library management system. Not loan tracking. A storefront.
- **Users:** All company employees (public, no login) + admins (role-based, dedicated credentials)
- **Scale:** ~60 books at launch; expected slow organic growth

---

## Technical Stack — Decided, Non-Negotiable

- **Frontend:** Angular SPA
- **Backend:** .NET REST API
- **Database:** SQLite (adequate for 60 books, read-heavy, low concurrency)
- **Hosting:** Sovereign French cloud — OVH VPS Starter (~€3.99/mo) or Scaleway DEV1-S (~€4.99/mo)
- **Total infra cost target:** ~€5/month
- **Deployment:** Containerized (Docker-friendly for OVH/Scaleway)
- **Access:** Publicly accessible URL — no VPN, no intranet restriction
- **Auth model:** Dedicated admin credentials in-app — no corporate SSO, no Azure AD

---

## ISBN Scan → Auto-Fill Pipeline

- **Trigger:** Admin scans barcode with smartphone camera directly in the browser (no native app)
- **Scanning library options:** ZXing-js (open-source, Angular-compatible) OR native `BarcodeDetector` Web API (Chromium 2024+, no dependency)
- **Fallback for scanning:** Manual ISBN input field — essential for reliability (lighting/device variance)
- **Metadata source chain:**
  1. Open Library API (free, no API key, ISBN lookup: `openlibrary.org/api/books?bibkeys=ISBN:...`)
  2. Google Books API (free tier, API key required, 1,000 req/day — negligible for admin-only use)
  3. Manual entry form — when both APIs return nothing (French/niche titles at risk)
- **Cover images:** `covers.openlibrary.org/b/isbn/{ISBN}-M.jpg` — zero auth, direct URL embed
- **Google Books covers:** Check ToS before embedding thumbnails — may require attribution or have restrictions
- **Known risk:** Open Library data quality is inconsistent for French-language books — manual override on every field is required, not optional
- **Admin UX target:** ISBN scan to saved record in under 60 seconds (best case; manual entry path is longer)

---

## Data Model Hints

Fields per book (minimum):
- ISBN (13 or 10)
- Title
- Author(s)
- Genre / category
- Publication year
- Cover image URL (or stored locally)
- Curator note (admin-authored, free text — "why this book, who it's for")
- Date added (for "Recently Added" section)

Admin roles:
- At least two roles: `admin` and potentially `super-admin` (user management)
- Multiple admins supported from day one — architecture must not assume single admin

---

## Public UX Requirements

- No login, no account, no friction — browse immediately on page load
- Filter by: title, author, genre, publication year, free-text keyword (combined filters)
- Book detail page: title, author, genre, year, cover image, curator note
- "Recently Added" section on homepage — no tracking, no personalization needed, just sort by `date_added DESC` with a limit
- Must work on mobile browsers (employees browsing from phone)
- No native app — browser-based only

---

## Admin UX Requirements

- Login with dedicated credentials (username/password — no OAuth, no SSO)
- ISBN scan via browser camera on smartphone
- Auto-fill from API + editable fields before save
- CRUD: add, edit, delete books
- Curator note field per book
- Role-based: multiple admins manageable

---

## Scope Decisions — Explicit

**In v1:**
- Public catalog with filters + book detail + curator note + recently added
- Admin CRUD + ISBN scan + auto-fill + role-based auth
- Publicly accessible URL
- Angular + .NET + SQLite + sovereign French cloud

**Explicitly out of v1 (do not re-propose without user confirmation):**
- Loan / borrowing management ← most commonly proposed by AI, user has consciously excluded it
- Reservations or waitlists
- Employee user accounts / personalization
- Email or push notifications
- Usage analytics or admin dashboard
- Native mobile app
- SSO / corporate identity integration
- Search analytics

**On the roadmap (phase 2 trigger: borrowing requests become frequent):**
- Lightweight "checked out / available" toggle — admin-managed, no full ILS
- Architecture should anticipate this: a `status` field on the book entity from day one avoids a schema migration

---

## Launch Plan

- Announced via **Microsoft Teams** (company channel)
- **QR code posters** at the physical library location
- No IT validation required — confirmed by product owner
- Target: majority of employees aware within 1 month of launch

---

## Competitive Context (for PRD framing)

| Solution | Why it doesn't fit |
|----------|-------------------|
| Libib | SaaS, US servers, loan management bundled, not customizable |
| Calibre-Web | E-book file management only, not physical books |
| BookWyrm | Social/federated, PostgreSQL+Redis stack, overkill |
| Soutron | Enterprise pricing, not self-hostable |
| CLZ Books / Orca Scan | SaaS only, no Angular/.NET integration |

**Gap confirmed:** No open-source solution covers physical corporate catalog + ISBN scan admin + sovereign EU hosting + no loan management. This is a genuine niche.

---

## Risks to Acknowledge in PRD

- **API data quality:** French/niche titles may have poor Open Library coverage → manual entry fallback is load-bearing, not optional
- **SQLite concurrency:** Fine for v1; abstract data layer for future migration to PostgreSQL if scope expands
- **Cover image licensing:** Verify Google Books thumbnail embedding terms before implementation
- **Admin succession:** Catalog quality depends on the animator staying engaged — multi-admin support mitigates but doesn't eliminate this
- **Barcode scanning reliability:** ZXing-js is free but less robust than commercial SDKs (Dynamsoft, STRICH); a manual ISBN input field is non-negotiable

---

## Open Questions (not resolved during discovery)

- Will the public URL be on the company domain (e.g., `mediatheque.company.fr`) or a generic domain?
- Should the curator note support basic markdown (bold, links) or plain text only?
- Should cover images be stored locally (in the .NET backend) or fetched live from Open Library on each page load?
- Is there a preference for the admin password reset flow (email-based vs. admin-only reset)?

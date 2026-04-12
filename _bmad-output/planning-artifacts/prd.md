---
stepsCompleted: ["step-01-init", "step-02-discovery", "step-02b-vision", "step-02c-executive-summary", "step-03-success", "step-04-journeys", "step-05-domain", "step-06-innovation", "step-07-project-type", "step-08-scoping", "step-09-functional", "step-10-nonfunctional", "step-11-polish", "step-12-complete"]
inputDocuments:
  - "_bmad-output/planning-artifacts/product-brief-portail-mediatheque-conviale.md"
  - "_bmad-output/planning-artifacts/product-brief-portail-mediatheque-conviale-distillate.md"
workflowType: 'prd'
classification:
  projectType: web_app
  domain: general
  complexity: low
  projectContext: greenfield
---

# Product Requirements Document — Portail Médiathèque Conviviale

**Author:** Sezratty
**Date:** 2026-04-11

## Executive Summary

The **Portail Médiathèque Conviviale** is a publicly accessible web portal that transforms a 60-book physical library at a French ESN into a discoverable, visually engaging catalog — accessible from any device, without login or VPN. The portal's purpose is not library management: it is a conversation starter. Employees browse the collection, read the curator's personal notes on each book, and walk over to pick one up. The primary value is driving physical visits and reading conversations, not tracking inventory.

Two audiences: all company employees (public access, no friction) who want to discover what's worth reading before visiting; and the library animator (authenticated admin) who manages the collection from a smartphone in under 60 seconds per book using ISBN barcode scanning and API-powered auto-fill.

### What Makes This Special

The curator is the product. Every book carries a personal note — why it's worth reading, who it's for — authored by the animator. No algorithm, recommendation engine, or social layer replaces this. The homepage surfaces two editorial signals: **"Recently Added"** (automatic, recency-sorted) and **"Sélection du mois"** (manually curated by the animator, renewed monthly). Together they give colleagues a reason to return regularly and give the animator a publishing rhythm that keeps the portal alive.

No competing solution fits this context: physical corporate catalog, sovereign French hosting, ISBN-scan admin UX, no loan management, no enterprise pricing.

### Project Classification

| Attribute | Value |
|-----------|-------|
| Project Type | Web application (Angular SPA + .NET REST API) |
| Domain | Internal knowledge sharing / corporate library |
| Complexity | Low — ~60 books, read-heavy, SQLite, no regulated domain |
| Project Context | Greenfield |

## Success Criteria

### User Success

- Colleagues discover books without a physical visit — browsing takes under 30 seconds from page load
- No login prompts, no broken cover images, no dead links on any public page
- Portal works on mobile browsers (Chrome/Safari on iOS and Android)
- "Recently Added" and "Sélection du mois" sections are visible and accurate on the homepage

### Business Success

- At least one colleague proactively mentions finding a book on the portal within the first month of launch
- New books added to the catalog within 1 day of arriving on the shelf
- Majority of company employees aware of the portal within 1 month of launch (via Teams + QR code posters)
- "Sélection du mois" published at least once per month by the animator

### Technical Success

- ISBN scan to saved record in under 60 seconds on a smartphone browser
- Open Library / Google Books auto-fill works for the majority of the collection; manual override available for all fields
- Application deployed on sovereign French cloud (OVH or Scaleway) for ≤€5/month
- No authentication dependency on corporate SSO or Azure AD

### Measurable Outcomes

| Signal | Target |
|--------|--------|
| Frictionless public browsing | Zero login prompts, zero broken covers at launch |
| Admin efficiency | ISBN scan → saved record < 60 seconds |
| Catalog currency | New books added within 1 day of physical arrival |
| Awareness | Majority of employees informed within 1 month of launch |
| Editorial rhythm | "Sélection du mois" published monthly |
| Footfall signal | ≥1 unprompted book conversation per month (qualitative) |

## Product Scope

### MVP — Phase 1

**Approach:** Problem-solving MVP — minimum needed to make the physical collection discoverable and admin workflow frictionless. No loan tracking, no user accounts, no personalization. Scope is deliberately narrow and stable.

**Resource:** Solo developer (the product owner), building in spare time. Single sovereign French VPS.

**Capabilities:**
- Public catalog: browse, filter (title, author, genre, year, keyword), book detail with cover + curator note
- Homepage: "Recently Added" (auto, `date_added DESC`) + "Sélection du mois" (admin-curated)
- Admin: ISBN barcode scan via browser camera + manual ISBN input fallback; Open Library / Google Books auto-fill; manual override on all fields; full CRUD; curator note per book; Sélection du mois flag per book
- Role-based admin auth with dedicated credentials (no SSO)
- Angular SPA + .NET REST API + SQLite; deployed on sovereign French cloud; publicly accessible URL (no VPN)

### Growth — Phase 2

Triggered when borrowing requests become frequent:
- Lightweight availability toggle: "disponible / emprunté" — admin-managed, no full ILS
- Multi-admin user management interface (super-admin role)
- Note: `status` field included in book entity from day one to avoid a schema migration

### Vision — Phase 3

- Multi-library model (other ESN offices or teams)
- Basic usage signals (most-viewed books) — if demand arises

### Risk Mitigation

**Technical:**
- ISBN scan reliability varies by device and lighting — mandatory manual ISBN input field is a non-negotiable fallback
- Open Library data quality inconsistent for French-language titles — manual override on every field required
- SQLite acceptable for v1; data access layer abstracted to allow future migration to PostgreSQL

**Market:** Internal tool with captive audience; no acquisition risk. Success depends on animator engagement.

**Resource:** Scope is minimal and stable — achievable solo in spare time without cuts.

## User Journeys

### Journey 1 — Karim, the curious employee (happy path)

Karim is a consultant with a few quieter days between projects. He's heard a colleague mention a book on architecture decision records but can't remember the title. At lunch he opens his phone and scans the QR code near the coffee machine.

The homepage loads immediately — no login, no spinner. He sees the "Sélection du mois": a book on engineering leadership with the animator's note. Interesting, but not what he's looking for. He types "architecture" — two results appear with covers and curator notes. One matches. He reads: *"Incontournable si tu travailles avec des équipes distribuées."* He'll grab it this afternoon.

**Capabilities revealed:** Homepage (Sélection du mois + Recently Added), full-text search, book detail with curator note, mobile-responsive, no authentication.

---

### Journey 2 — Sophie, the remote employee (browsing from home)

Sophie works from home three days a week and never makes the trip to browse the library. On a Tuesday evening she opens the portal from her laptop — no VPN required. She filters by genre ("management") and year (2020+). Four books appear. She notes one to pick up Thursday.

**Capabilities revealed:** Public access without VPN, filter by genre + year, desktop browser support.

---

### Journey 3 — Sezratty, the animator (adding a new book)

Two new books arrive. Sezratty opens the admin panel on his phone, taps "Ajouter un livre", and scans the barcode. ISBN read instantly. Title, author, year, cover fill in from Open Library. He adds his curator note, marks the book as "Sélection du mois", and saves. Under 60 seconds. The second book follows without the featured flag. Both are live immediately.

**Capabilities revealed:** ISBN barcode scan in browser, Open Library auto-fill, editable fields, curator note, Sélection du mois toggle, instant publish.

---

### Journey 4 — Sezratty, the animator (API fallback)

A recent French-language book on agile coaching returns only title and ISBN from Open Library; Google Books adds nothing. Sezratty fills in author and year manually, uploads a cover photo, writes his curator note, and saves. The book appears on the portal with full information.

**Capabilities revealed:** Manual override on all fields, graceful API degradation, manual ISBN input fallback.

---

### Journey Requirements Summary

| Journey | Capabilities Required |
|---------|----------------------|
| Karim — discovery | Homepage (Sélection du mois + Recently Added), keyword search, book detail, mobile, no login |
| Sophie — remote browse | Public URL (no VPN), filter by genre + year, desktop support |
| Sezratty — add book | Admin auth, ISBN scan, API auto-fill, cover image, curator note, Sélection du mois flag, CRUD |
| Sezratty — fallback | Manual field override, manual ISBN input, graceful API degradation |

## Web Application Requirements

### Architecture

- **SPA:** Angular SPA with client-side routing — public routes unguarded; admin routes behind JWT auth guard
- **API:** REST over HTTPS; Angular HttpClient for all backend calls
- **State:** Component-level state sufficient — no NgRx required at this scale
- **Deployment:** Angular CLI static output + containerized .NET API

### Browser Support

- **Target:** Evergreen browsers only — Chrome, Firefox, Safari, Edge (last 2 major versions)
- **Mobile:** Chrome on Android, Safari on iOS — required for ISBN scan and browsing
- **Excluded:** IE11, legacy Edge, older Safari

### Responsive Design

- Mobile-first for the public catalog; admin interface optimized for smartphone portrait mode
- Tablet/desktop supported for remote browsing
- No native app, no PWA for v1

### Implementation Notes

- Angular standalone components (no NgModules)
- Lazy-loaded admin module — not bundled with public pages
- HTTP interceptor for JWT attachment on admin API calls
- Graceful fallback UI when API calls or cover image URLs fail

## Functional Requirements

### Catalog Discovery

- **FR1:** Any visitor can browse the complete book catalog without authentication
- **FR2:** Any visitor can view book cover images alongside catalog entries
- **FR3:** Any visitor can filter the catalog by title
- **FR4:** Any visitor can filter the catalog by author
- **FR5:** Any visitor can filter the catalog by genre/category
- **FR6:** Any visitor can filter the catalog by publication year
- **FR7:** Any visitor can search the catalog using a free-text keyword across all fields
- **FR8:** Any visitor can combine multiple filters simultaneously
- **FR9:** Any visitor can access the portal from any device without VPN or corporate network access

### Book Detail

- **FR10:** Any visitor can view a book's full detail page: title, author, genre, publication year, cover image, and curator note
- **FR11:** Any visitor can navigate from a catalog entry to the book's detail page
- **FR12:** The system displays the curator's personal note for each book on its detail page

### Homepage Editorial

- **FR13:** Any visitor can see a "Recently Added" section on the homepage, sorted by `date_added DESC`
- **FR14:** Any visitor can see a "Sélection du mois" section on the homepage showing admin-featured books
- **FR15:** The "Sélection du mois" section displays featured books with cover, title, and curator note

### Admin Authentication

- **FR16:** An admin can log in with a dedicated username and password — no SSO, no corporate identity
- **FR17:** The system enforces role-based access control — only authenticated admins can access the admin interface
- **FR18:** Multiple admins can hold active accounts simultaneously
- **FR19:** An admin can log out of the admin interface

### Book Management

- **FR20:** An admin can add a new book to the catalog
- **FR21:** An admin can edit any field of an existing book
- **FR22:** An admin can delete a book from the catalog
- **FR23:** An admin can write and edit a curator note for any book
- **FR24:** An admin can mark a book as the "Sélection du mois"
- **FR25:** An admin can remove the "Sélection du mois" flag from a book
- **FR26:** The system stores a `status` field on each book entity to support future availability tracking without a schema migration

### ISBN Scan & Metadata Auto-Fill

- **FR27:** An admin can scan a book's ISBN barcode using a smartphone camera directly in the browser
- **FR28:** An admin can enter an ISBN manually as a fallback when barcode scanning fails
- **FR29:** The system auto-fills book metadata from Open Library using the scanned or entered ISBN
- **FR30:** The system falls back to Google Books API when Open Library returns no or incomplete data
- **FR31:** An admin can override any auto-filled field before saving
- **FR32:** The system displays a cover image retrieved from Open Library when available
- **FR33:** An admin can save a new book record with only partially auto-filled data

### Data Model

- **FR34:** Each book record stores: ISBN, title, author(s), genre/category, publication year, cover image URL, curator note, date added, Sélection du mois flag, and status
- **FR35:** The system records the date a book was added to the catalog automatically

## Non-Functional Requirements

### Performance

- **NFR1:** The public catalog page must reach interactive state in under 3 seconds on a standard 4G mobile connection
- **NFR2:** Filter and search operations must return results within 1 second for a catalog of up to 500 books
- **NFR3:** Cover images are served from Open Library CDN — the API backend must not proxy image files
- **NFR4:** The admin ISBN scan → auto-fill → save sequence must complete in under 60 seconds under normal network conditions

### Security

- **NFR5:** All traffic must be served over HTTPS — no plain HTTP in production
- **NFR6:** Admin passwords stored as salted hashes (bcrypt or equivalent) — no plain text
- **NFR7:** JWT tokens expire after 8 hours; refresh token optional for v1
- **NFR8:** Admin API endpoints return HTTP 401 for unauthenticated requests
- **NFR9:** Internal error details and stack traces must not be exposed to the browser in production

### Integration

- **NFR10:** Open Library API unavailability must not block the admin from saving a book manually
- **NFR11:** Google Books API unavailability must not block the admin from saving a book manually
- **NFR12:** Google Books API key stored as environment variable — not hardcoded in source
- **NFR13:** Cover image URLs validated before storage — broken URLs must not surface on the public catalog

### Reliability

- **NFR14:** Application targets ≥99% monthly uptime on OVH or Scaleway VPS
- **NFR15:** SQLite database file backed up daily minimum
- **NFR16:** Application restarts automatically after a crash (Docker restart policy)

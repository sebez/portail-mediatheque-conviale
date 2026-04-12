---
stepsCompleted: ["step-01-init", "step-02-discovery", "step-02b-vision", "step-02c-executive-summary", "step-03-success", "step-04-journeys", "step-05-domain", "step-06-innovation"]
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

# Product Requirements Document - portail-mediatheque-conviale

**Author:** Sezratty
**Date:** 2026-04-11

## Executive Summary

The **Portail Médiathèque Conviviale** is a publicly accessible web portal that transforms a 60-book physical library at a French ESN into a discoverable, visually engaging catalog — accessible from any device, without login or VPN. The portal's purpose is not library management: it is a conversation starter. Employees browse the collection, read the curator's personal notes on each book, and walk over to pick one up — or stop by to discuss it. The primary value is driving physical visits and reading conversations, not tracking inventory.

The portal serves two audiences: all company employees (public access, no friction) who want to know what's worth reading before making the effort to visit; and the library animator (authenticated admin) who manages the collection from a smartphone in under 60 seconds per book using ISBN barcode scanning and API-powered auto-fill.

### What Makes This Special

The curator is the product. Every book carries a personal note — why it's worth reading, who it's for — authored by the animator. No algorithm, recommendation engine, or social layer replaces this. The homepage surfaces two distinct editorial signals: **"Recently Added"** (automatic, recency-sorted) and **"Sélection du mois"** (manually curated by the animator, renewed monthly). Together they give colleagues a reason to check back regularly, and give the animator a publishing rhythm that keeps the portal alive.

There is no competing solution that fits this exact context: physical corporate catalog, sovereign French hosting, ISBN-scan admin UX, no loan management, no enterprise pricing.

### Project Classification

| Attribute | Value |
|-----------|-------|
| Project Type | Web application (Angular SPA + .NET REST API) |
| Domain | Internal knowledge sharing / corporate library |
| Complexity | Low — ~60 books, read-heavy, SQLite, no regulated domain |
| Project Context | Greenfield |

## Success Criteria

### User Success

- Colleagues discover books without a physical visit — browsing the catalog takes under 30 seconds from page load
- No login prompts, no broken cover images, no dead links on any public page
- Portal works correctly on mobile browsers (Chrome/Safari on iOS and Android)
- "Recently Added" and "Sélection du mois" sections are visible and accurate on the homepage

### Business Success

- At least one colleague proactively mentions finding a book on the portal within the first month of launch
- New books are added to the catalog within 1 day of arriving on the shelf
- Majority of company employees are aware of the portal within 1 month of launch (via Teams announcement + QR code posters)
- "Sélection du mois" is published at least once per month by the animator

### Technical Success

- ISBN scan to saved record in under 60 seconds on a smartphone browser
- API auto-fill (Open Library + Google Books fallback) works for the majority of books in the collection; manual override available for all fields
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

### MVP — Minimum Viable Product

- Public catalog: browse, filter (title, author, genre, year, keyword), book detail page with cover and curator note
- Homepage: "Recently Added" section (auto, `date_added DESC`) + "Sélection du mois" (admin-curated, manually set)
- Admin: ISBN barcode scan via browser camera + manual ISBN input fallback; auto-fill from Open Library / Google Books; full CRUD; curator note per book; "Sélection du mois" flag per book
- Role-based admin access (multiple admins from day one); dedicated credentials (no SSO)
- Angular SPA + .NET REST API + SQLite; deployed on sovereign French cloud; publicly accessible URL

### Growth Features (Post-MVP)

- Lightweight availability toggle: "disponible / emprunté" — admin-managed, no full ILS required
- Multi-admin user management interface (super-admin role)

### Vision (Future)

- Multi-library model (other ESN offices or teams)
- Basic usage signals (most-viewed books) — if demand arises

## User Journeys

### Journey 1 — Karim, the curious employee (happy path)

Karim is a consultant who's just finished a project and has a few quieter days before the next engagement. He's heard a colleague mention something about a book on architecture decision records but can't remember the title. He opens his phone during lunch, types the portal URL from the QR code he noticed near the coffee machine last week.

The homepage loads immediately — no login screen, no spinner asking him to wait. He sees the "Sélection du mois" at the top: a book on engineering leadership with a short note from the animator explaining who it's for. Interesting, but not what he's looking for. He types "architecture" in the search bar. Two results appear with covers, titles, and the animator's note on each. One matches what his colleague mentioned. He reads the curator note: *"Incontournable si tu travailles avec des équipes distribuées."* That's enough — he knows where the library is, he'll grab it this afternoon.

**Capabilities revealed:** Homepage with Sélection du mois + Recently Added, full-text search, book detail with curator note, mobile-responsive, no authentication.

---

### Journey 2 — Sophie, the remote employee (edge case: browsing from home)

Sophie works from home three days a week. She's been meaning to explore the library catalog but never makes the trip on office days just to browse. On a Tuesday evening she opens the portal from her laptop at home — no VPN required, the URL just works. She filters by genre ("management") and publication year (2020 onwards). Four books appear. She adds a mental note to pick up one of them on Thursday when she's in the office.

**Capabilities revealed:** Public access without VPN, filter by genre + year, works on desktop browser outside corporate network.

---

### Journey 3 — Sezratty, the animator (adding a new book)

A package arrives: two new books ordered last week. Sezratty picks up the first one, opens the admin panel on his phone, taps "Ajouter un livre". He points the camera at the barcode. The ISBN is read instantly. Title, author, publisher, and year fill in automatically from Open Library. The cover thumbnail appears. He adds his curator note — two sentences about why he chose this book and who it's for — taps "Sélection du mois" to feature it this month, and saves. Under 60 seconds. He does the same for the second book, without the featured flag. Both are live on the portal immediately.

**Capabilities revealed:** ISBN barcode scan in browser, Open Library auto-fill, cover image, editable fields, curator note, Sélection du mois toggle, instant save.

---

### Journey 4 — Sezratty, the animator (edge case: API returns nothing)

The third new arrival is a recent French-language book on agile coaching. Sezratty scans the ISBN — the auto-fill returns only the title and ISBN; no author, no cover, no year. Open Library doesn't have it; Google Books returns the same partial data. No problem: all fields are editable. He fills in the author and year manually, uploads a cover photo he took with his phone, writes his curator note, and saves. The book appears on the portal with full information.

**Capabilities revealed:** Manual override on all fields, graceful degradation when APIs return incomplete data, manual ISBN input as fallback if scan fails.

---

### Journey Requirements Summary

| Journey | Capabilities Required |
|---------|----------------------|
| Karim — discovery | Homepage (Sélection du mois + Recently Added), keyword search, book detail, mobile browsing, no login |
| Sophie — remote browse | Public URL (no VPN), filter by genre + year, desktop browser support |
| Sezratty — add book | Admin auth, ISBN scan, API auto-fill, cover image, curator note, Sélection du mois flag, CRUD |
| Sezratty — fallback | Manual field override, manual ISBN input, graceful API degradation |

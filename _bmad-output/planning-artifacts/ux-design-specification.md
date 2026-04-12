---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
inputDocuments:
  - "_bmad-output/planning-artifacts/product-brief-portail-mediatheque-conviale.md"
  - "_bmad-output/planning-artifacts/product-brief-portail-mediatheque-conviale-distillate.md"
  - "_bmad-output/planning-artifacts/prd.md"
---

# UX Design Specification — Portail Médiathèque Conviviale

**Author:** Sezratty
**Date:** 2026-04-12

---

<!-- UX design content will be appended sequentially through collaborative workflow steps -->

## Executive Summary

### Project Vision

A publicly accessible, visually engaging catalog for a physical 60-book corporate library at a French ESN. The portal's purpose is not library management — it is a conversation starter. The curator's personal notes transform a bare catalog into a reading guide. Two homepage editorial sections ("Recently Added" and "Sélection du mois") give employees a reason to return and the animator a publishing rhythm.

### Target Users

**Employees (public, unauthenticated):** Knowledge workers and consultants browsing primarily on mobile, including from home. Discovery-oriented — they want to know what's available before making the physical trip. Expect zero friction: no login, instant load, works without VPN.

**Library Animator / Admin (Sezratty):** Solo curator managing the collection from a smartphone. Needs a fast, reliable add-book flow (ISBN scan → auto-fill → save in under 60 seconds). Simplicity over feature density.

### Key Design Challenges

1. **Mobile-first rich content:** Cover images and curator notes must be visually compelling on small screens without sacrificing scanability. Card layout decisions are critical.
2. **Browser-based ISBN scan UX:** Camera barcode scanning in a browser needs clear feedback — visible viewfinder, instant scan confirmation, and a friction-free fallback to manual ISBN entry.
3. **Admin simplicity:** The admin interface must stay minimal — no dashboard complexity, just fast CRUD. Resisting over-engineering is a design constraint.

### Design Opportunities

1. **Curator note as hero:** Typographically elevate the animator's personal note on book detail pages — this is the product differentiator, not the metadata.
2. **Homepage as editorial surface:** "Sélection du mois" deserves visual weight beyond a list item — a feature card with cover, title, and the curator's voice.
3. **Speed as a design value:** Zero-friction browsing (public) and 60-second add flow (admin) should feel intentional through design choices — minimal transitions, immediate feedback, no unnecessary steps.

## Core User Experience

### Defining Experience

The portal has two distinct core experiences with different success definitions:

**For employees:** Visual discovery — landing on the homepage, seeing the "Sélection du mois" feature prominently, then scrolling the catalog. The core loop is browsing, not searching. A successful session ends when a cover + curator note combination triggers the thought "I want to read that."

**For the animator:** Frictionless catalog maintenance — scanning a barcode, reviewing auto-filled metadata, writing a curator note, and saving. The core loop is add → publish. A successful session takes under 60 seconds and requires only a smartphone.

### Platform Strategy

- **Public interface:** Mobile-first web SPA. Touch-optimized layout, readable without pinching or zooming, works without VPN on any modern mobile browser.
- **Admin interface:** Smartphone portrait mode — large touch targets, camera access for barcode scanning, minimal form complexity. No desktop required.
- **Shared constraint:** Evergreen browsers only (Chrome, Firefox, Safari, Edge — last 2 versions). No native app, no PWA.

### Effortless Interactions

- **Public:** Homepage loads immediately with no modal, no login prompt, no cookie wall. The "Sélection du mois" card is the first thing seen. Browsing the catalog requires zero setup.
- **Public:** Book detail accessible in one tap from any catalog entry. Curator note readable without scrolling past metadata.
- **Admin:** ISBN scan → auto-fill → save is a linear 3-step flow with no dead ends. If the scan fails, manual ISBN entry is immediately available in the same view. If the API returns nothing, all fields are editable in place.
- **Admin:** "Sélection du mois" flag is a single toggle on the add/edit form — not a separate workflow.

### Critical Success Moments

1. **The cover + note moment:** A visitor sees a book cover alongside the animator's curator note and feels the pull to pick it up. This is the product's core value — design must frame this pairing clearly.
2. **The 60-second save:** The animator scans a barcode, the form fills in, they add a note and tap save. The book is immediately live. No confirmation dialogs, no review queue.
3. **The homepage return visit:** A colleague who visited last week returns and immediately sees the "Sélection du mois" has changed — a signal the portal is alive and curated.

### Experience Principles

1. **Discovery before search:** The homepage is a browsing surface, not a search box. Visual hierarchy favors covers and curator voice over filters.
2. **Catalog view:** List layout with covers + metadata (title, author, genre) — readable and scannable, not a pure image grid. Covers are prominent but don't crowd out information.
3. **Editorial weight on the homepage:** "Sélection du mois" is a feature card at the top — larger cover, full curator note visible, visual separation from the rest of the catalog.
4. **Admin is a tool, not a product:** The admin interface is minimal by design — fast CRUD with no dashboard, no metrics, no complexity beyond what's needed to manage a 60-book collection.
5. **No friction gates:** Public users encounter zero authentication barriers. Admin access via a discreet link/button on the public site — unobtrusive to visitors, accessible when needed.

## Desired Emotional Response

### Primary Emotional Goals

**For employees (public browsing):**
*Pleasant discovery leading to anticipation.* The portal should feel like browsing a well-curated shelf — not task completion, but the quiet pleasure of finding something worth reading. The emotional arc: **curiosity → pull → anticipation** of picking the book up.

**For the animator (admin):**
*Competence and ease.* The satisfaction of a tool that doesn't fight you. Scan, review, note, save — done. The dominant feeling is quiet efficiency, not achievement.

**Overall product tone:** *"Simple and it just works."* Every design decision should be tested against this. If a feature or element adds visual noise or requires explanation, it doesn't belong.

### Emotional Journey Mapping

| Stage | Employee | Animator |
|-------|----------|----------|
| Arrival | Immediate comfort — no login, no friction, content visible instantly | Login is fast and remembered — no ceremony |
| Browsing/Working | Gentle pull from covers + curator notes; browsing feels natural | Form fills itself; no wrestling with fields |
| Core moment | Cover + curator note creates desire to read | Book saved and live — quiet satisfaction |
| Error/Fallback | No panic — missing cover or API failure handled gracefully, no broken UI | Scan fails → manual entry is right there, no dead end |
| Return visit | Homepage feels alive — "Sélection du mois" has changed, new books visible | Muscle memory — same flow every time |

### Micro-Emotions

- **Confidence, not confusion:** The public user always knows where they are and what to do next — no orphaned pages, no dead links
- **Trust, not skepticism:** A discreet catalog freshness signal (e.g., "X livres · mis à jour le [date]" in the footer or below the catalog header) tells visitors the collection is maintained without announcing it
- **Delight, not surprise:** The curator note is the moment of unexpected warmth — a human voice in what could otherwise be a dry list
- **Accomplishment, not frustration (admin):** Every save is immediate and visible; no confirmation dialogs, no review queues

### Design Implications

- **"Simple and it just works"** → No onboarding, no tooltips, no modals. The interface is self-evident.
- **Curiosity → pull** → Covers and curator notes are visually paired and given space — not squeezed into a dense list
- **Trust signal** → A single low-key line in the footer or below the catalog: *"X livres dans la collection · Mis à jour le [date]"*
- **No dead ends (admin)** → Every error state has an immediate recovery path visible in the same view
- **Alive portal signal** → "Sélection du mois" is dated or labeled (e.g., "Avril 2026") so returning visitors know it's fresh

### Emotional Design Principles

1. **Invisible interface:** The best interaction is the one the user doesn't notice — they just get what they came for
2. **Human voice over metadata:** The animator's note is the emotional core; typography and layout must give it room to breathe
3. **Passive trust:** The portal signals currency and care without demanding attention — freshness date, complete covers, no broken states
4. **No dead ends:** Every failure state — broken cover, failed scan, empty API response — has a graceful path forward visible immediately
5. **Calm efficiency:** Neither the public nor the admin experience should feel rushed or complex. The right pace is quiet and sure.

## UX Pattern Analysis & Inspiration

### Inspiring Products Analysis

**VS Code** — Zero-friction tool design. Opens and works immediately with no onboarding, no wizard, no setup ceremony. Powerful capabilities (search, extensions) are available but not pushed onto the user. Every action has instant, quiet feedback. Error states are clear and actionable.

**Trainline** — Mobile-first card-based information design. Cards carry exactly the right density: enough to decide, not enough to overwhelm. Secondary detail is one tap away, not front-loaded. No dead ends — every error has a visible next step. Touch targets are generous and forgiving.

**Spotify** — Discovery-first visual browsing. Cover art is the primary navigation element — browsing is visual, not textual. Editorial curation (featured playlists, "New releases") has real visual weight: a large feature card at the top, separate from the scrollable grid below. Human curation feels warm and personal — distinct from algorithmic lists.

### Transferable UX Patterns

**Navigation & Structure:**
- Spotify's two-zone homepage (large feature card → scrollable catalog below) → maps directly to "Sélection du mois" card + catalog list
- VS Code's sidebar-free simplicity → admin panel with no dashboard, no nav chrome, just the task

**Interaction Patterns:**
- Trainline's "tap card → detail view" pattern → book card → book detail page
- VS Code's instant, quiet feedback on save → admin save with no modal, no confirmation dialog, just immediate update
- Trainline's inline error recovery → admin scan failure → manual ISBN field appears in place, no navigation away

**Visual Patterns:**
- Spotify's cover-first browsing → list layout with prominent covers left-anchored, metadata right
- Trainline's card density → title + author + genre readable at a glance; curator note reserved for detail view
- Spotify's editorial card → "Sélection du mois" as a full-width feature card with large cover + visible curator note

### Anti-Patterns to Avoid

- **Spotify's algorithm noise** — infinite scroll, "Fans also like", social features. This portal is curated, not algorithmic. No recommendations, no related books, no "popular" signals.
- **VS Code's complexity ceiling** — settings panels, multi-pane layouts. Admin stays single-column, single-task.
- **Trainline's upsell friction** — promotional banners, seat selection overlays. The portal has nothing to sell. No promotional surface.
- **Any product's modal habit** — login prompts, cookie walls, newsletter popups. Zero modals on the public interface.

### Design Inspiration Strategy

**Adopt directly:**
- Spotify's two-zone homepage structure (feature card → catalog)
- Spotify's cover-as-hero visual language
- VS Code's zero-ceremony interaction model for admin
- Trainline's card information density and touch target sizing

**Adapt:**
- Spotify's editorial card → simpler, text-forward version (curator note is the content, not a background image)
- Trainline's list cards → add cover image left-anchor, tune density for a reading context rather than a transactional one

**Avoid:**
- Algorithmic or social features from any of the three
- Any modal, overlay, or promotional surface
- Multi-level navigation or dashboard chrome

## Design System Foundation

### Design System Choice

**Angular Material (MDC)** with a custom warm editorial theme.

### Rationale for Selection

- First-party Angular integration — no adapter layer, no compatibility risks, minimal configuration
- Complete component coverage for all required UI: cards, list items, form fields, buttons, filter chips, snackbars, bottom sheets (for mobile scan flow)
- Accessible by default — touch targets, ARIA attributes, keyboard navigation handled at the component level
- Theming via CSS custom properties — straightforward to apply the custom palette without overriding component internals
- Right fit for a solo developer on a spare-time project — no time spent building primitive components

### Color Palette

| Role | Token | Value |
|------|-------|-------|
| Background | `--color-background` | `#F8F5F0` |
| Surface (cards) | `--color-surface` | `#FFFFFF` |
| Text primary | `--color-on-surface` | `#1A1A1A` |
| Text secondary | `--color-on-surface-variant` | `#6B6561` |
| Accent / Primary | `--color-primary` | `#B85C38` |
| Accent light | `--color-primary-container` | `#F4E4DC` |
| Border / divider | `--color-outline` | `#E8E3DD` |

**Rationale:** Warm parchment background evokes reading and books without being decorative. Deep terracotta accent is warm and human — works alongside diverse cover art without clashing. High contrast on charcoal/parchment for mobile readability.

### Typography

- **Font:** Inter (system stack fallback: `-apple-system, BlinkMacSystemFont, 'Segoe UI'`)
- **Scale:** Angular Material default type scale — no custom display sizes needed at this scope
- **Curator note:** Set in a slightly larger body size with relaxed line-height (`1.6`) to give the human voice visual room

### Implementation Approach

- Apply Angular Material M3 theming via `@use '@angular/material' as mat` with a custom palette derived from the terracotta accent
- Override background and surface tokens in the global theme to use warm parchment instead of Material's default white
- No third-party icon library — use Angular Material Icons (already bundled)

### Customization Strategy

- Minimal overrides: only background, surface, and primary palette tokens need customization; all other Material defaults are appropriate
- Book cover images provide natural color variety — the neutral palette is intentionally restrained to not compete with cover art
- Admin interface uses the same theme — no separate admin stylesheet needed

## Core User Experience

### 2.1 Defining Experience

**For employees:** *"Browse covers and find a book worth picking up."*
The defining moment is a visitor seeing a book cover alongside the curator's note and feeling the pull to go get it. This is not search — it is browsing. Like walking past a well-arranged shelf and stopping because something catches your eye.

**For the animator:** *"Scan a barcode and have the book live on the portal in under 60 seconds."*
The defining moment is the barcode scan triggering an instant auto-fill — watching the form populate itself — then adding a personal note and tapping save. Fast, reliable, satisfying.

### 2.2 User Mental Model

**Employees:** The mental model is a bookshop or a library display — not a search engine, not a database. Users expect to scroll visually, be drawn in by covers, and read short human descriptions before deciding if something is worth their time. They do not expect to fill in search fields to start browsing.

**Animator:** The mental model is a barcode scanner at a checkout — point, shoot, done. Users expect the scan to work on the first try, the form to fill itself, and the save to be immediate. The fallback (manual entry) should feel like a cashier typing a price manually — a known alternative, not a failure.

### 2.3 Success Criteria

**Employee browsing:**
- Homepage is fully visible and interactive within 3 seconds, no friction gates
- "Sélection du mois" card is the first element with visual weight — readable without scrolling on mobile
- A book's cover + curator note is readable together without navigating away (on the detail page, both are above the fold on mobile)
- Filter combinations return results instantly — no loading state for a 60-book catalog

**Admin add flow:**
- Barcode scan triggers auto-fill within 2 seconds of a successful read
- If the scan fails, the manual ISBN field is visible in the same view — no navigation required
- After save, the book appears in the catalog immediately — no reload, no confirmation dialog
- The full flow (scan → review → write note → save) completes in under 60 seconds on a standard smartphone

### 2.4 Novel vs. Established Patterns

Both core experiences use **established patterns** — no novel interaction design required:

- **Browse + detail** (Spotify, Trainline): established list/card → detail navigation pattern
- **Barcode scan in browser**: established via `BarcodeDetector` Web API and ZXing-js; users familiar with QR code scanning in browsers have the right mental model
- **Form auto-fill from external lookup**: established pattern (address autocomplete, ISBN lookup in bookshop tools)

No user education needed. The only friction point to design around is scan fallback — which must feel like a natural continuation, not an error state.

### 2.5 Experience Mechanics

**Public browsing flow:**

1. **Arrival:** Homepage loads immediately — "Sélection du mois" feature card visible, catalog list below
2. **Browsing:** User scrolls the catalog list; each item shows cover (left) + title, author, genre (right); tap opens detail
3. **Detail:** Book detail page shows large cover, full metadata, and curator note prominently; back navigation returns to catalog with scroll position preserved
4. **Search/filter:** Filter bar above catalog; typing or selecting filters narrows results in real time; filters are dismissible chips

**Admin add-book flow:**

1. **Initiation:** Admin taps "Ajouter un livre" — camera viewfinder opens full-screen with a scan overlay
2. **Scan:** Barcode detected → viewfinder closes → form populates with auto-filled data; scanning library provides immediate visual confirmation
3. **Review & edit:** All fields editable; cover thumbnail shown; "Sélection du mois" toggle visible; curator note field focused by default after auto-fill
4. **Fallback:** If scan fails after 5 seconds or user taps "Saisir manuellement", viewfinder closes and ISBN text field is focused — same form, no new page
5. **Save:** Tap "Enregistrer" — immediate success feedback (snackbar: "Livre ajouté"), form resets for next entry; book is live on public portal instantly

## Visual Design Foundation

### Color System

Based on the warm editorial palette established in the Design System Foundation:

| Role | Token | Value | Usage |
|------|-------|-------|-------|
| Background | `--color-background` | `#F8F5F0` | Page background, app shell |
| Surface | `--color-surface` | `#FFFFFF` | Cards, form fields, dialogs |
| Text primary | `--color-on-surface` | `#1A1A1A` | Body text, headings, titles |
| Text secondary | `--color-on-surface-variant` | `#6B6561` | Author, genre, metadata labels |
| Accent / Primary | `--color-primary` | `#B85C38` | Buttons, active states, links |
| Accent container | `--color-primary-container` | `#F4E4DC` | Filter chips, tag backgrounds |
| Outline | `--color-outline` | `#E8E3DD` | Card borders, dividers, input borders |
| Error | `--color-error` | `#BA1A1A` | Scan error, validation feedback |
| Success | `--color-success` | `#386A20` | Save confirmation snackbar |

**Contrast ratios (WCAG AA compliance as a baseline):**
- `#1A1A1A` on `#F8F5F0` → ~16:1 ✓
- `#6B6561` on `#FFFFFF` → ~5.4:1 ✓
- `#B85C38` on `#FFFFFF` → ~4.6:1 ✓ (meets AA for large text and UI components)

### Typography System

**Font family:** Inter, with system stack fallback (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`)

| Scale | Size | Weight | Line height | Usage |
|-------|------|--------|-------------|-------|
| Display | 24px | 600 | 1.3 | Portal name / page titles |
| Title large | 20px | 600 | 1.3 | "Sélection du mois" card title, section headers |
| Title medium | 16px | 600 | 1.4 | Book title in list and detail |
| Body large | 16px | 400 | 1.6 | Curator note — relaxed line-height for readability |
| Body medium | 14px | 400 | 1.5 | Author, genre, metadata |
| Label | 12px | 500 | 1.4 | Filter chips, tags, freshness signal |

**Key rule:** Curator note always rendered in Body large with `1.6` line-height — this is the most-read text in the product and must be comfortable on mobile.

### Spacing & Layout Foundation

**Base unit:** 8px. All spacing values are multiples of 8px (4px for fine adjustments).

**Common spacing tokens:**
- `xs`: 4px — icon padding, chip internal spacing
- `sm`: 8px — between label and value, tight internal padding
- `md`: 16px — card internal padding, form field spacing
- `lg`: 24px — between sections on homepage
- `xl`: 32px — page-level vertical rhythm

**Layout grid:**
- **Mobile (< 600px):** Single column, 16px horizontal margins
- **Tablet (600–960px):** Single column, 24px horizontal margins, max-width 720px centered
- **Desktop (> 960px):** Single column, max-width 800px centered — no multi-column layout needed for a 60-book catalog

**Single column rationale:** The catalog is a vertical scroll experience on all breakpoints. A grid of covers would work at desktop but fights the list + metadata pattern chosen for scannability.

**Book list item anatomy:**
```
[ Cover image 72×100px ] [ Title (Title medium)          ]
                          [ Author · Genre (Body medium)  ]
                          [ Curator note preview 2 lines  ]
```
- Cover: fixed 72×100px, object-fit: cover, warm grey placeholder if missing
- Right column: fills remaining width, 12px left padding from cover
- Curator note preview: 2-line clamp on list; full text on detail page

### Accessibility Considerations

- No formal WCAG target required for v1; colour contrast ratios meet AA baseline by design
- Touch targets: minimum 44×44px on all interactive elements (Angular Material default)
- Cover image alt text: book title used as alt attribute — no decorative-only images
- Filter chips keyboard-navigable via Angular Material chip list component
- Admin form fields: all inputs labelled (Angular Material `mat-label`) — no placeholder-only labels
- Missing cover: warm grey placeholder (`#E8E3DD`) with book icon — never a broken image icon

## Design Direction Decision

### Design Directions Explored

A single cohesive direction was generated and validated — the Warm Editorial direction — applied across 5 key screens: Homepage, Book Detail, Admin Book List, Admin ISBN Scan (scanner + form), and Admin Login. HTML mockup available at `_bmad-output/planning-artifacts/ux-design-directions.html`.

### Chosen Direction

**Warm Editorial** — single confirmed direction. Key characteristics:

- Parchment background (`#F8F5F0`) with white card surfaces — warm, book-adjacent feel
- "Sélection du mois" as a prominent feature card at the top of the homepage, with badge, month label, cover, and full curator note visible
- Catalog as a vertical list of book items: cover (left, 56×80px) + title/author/genre/note preview (right)
- Book detail: centered large cover, metadata chips, curator note in a dedicated section with editorial label
- Admin: dark app bar for clear context separation, scan viewfinder full-screen, auto-filled form with editable fields and Sélection du mois toggle
- Portal name: **"Médiathèque conviviale"** — wordmark with accent color on "conviviale"
- Freshness signal: footer line "X livres dans la collection · Mis à jour le [date]"
- Discreet "Admin" text link in the top-right of the public app bar

### Design Rationale

- Warm palette differentiates from generic enterprise tools without requiring custom illustration or photography
- List layout over grid: scannability + curator notes visible in preview — the differentiator is readable without a tap
- Feature card pattern (Spotify-inspired) gives the animator's monthly editorial pick the visual weight it deserves
- Admin dark header creates immediate visual context switch — the user knows they're in a different mode
- Single column layout throughout — no multi-column needed for a 60-book catalog; simplicity wins

### Implementation Approach

- Angular Material M3 theming with custom terracotta palette applied globally
- Homepage: two distinct zones — `mat-card` for Sélection du mois, custom list component for catalog items
- Book detail: standalone routed component, cover centered with `mat-card` for curator note section
- Admin book list: `mat-list` with action buttons; FAB (`mat-fab`) for add action
- Admin form: `mat-form-field` for all inputs; `mat-slide-toggle` for Sélection du mois flag; `mat-snack-bar` for save confirmation
- Scan screen: full-screen overlay component with ZXing-js/BarcodeDetector integration

## User Journey Flows

### Journey 1 — Employee: Homepage Discovery → Book Detail

```mermaid
flowchart TD
    A([Open portal URL]) --> B[Homepage loads\nSélection du mois visible]
    B --> C{User action}
    C -->|Reads Sélection du mois| D[Taps feature card]
    C -->|Scrolls to catalog| E[Browses list items]
    C -->|Has specific need| F[Types in search bar]
    F --> G[Real-time filtered results]
    G --> H{Results found?}
    H -->|Yes| E
    H -->|No| I[Empty state:\n'Aucun résultat — réinitialiser les filtres']
    I --> J[Taps filter chip to reset]
    J --> E
    E -->|Taps filter chip| K[Catalog filtered by category]
    K --> E
    E -->|Taps book item| D
    D --> L[Book detail page:\nCover · Metadata · Curator note]
    L --> M{User decision}
    M -->|Interested| N([Goes to pick up the book])
    M -->|Not for me| O[Back → catalog\nscroll position preserved]
    O --> E
```

**Key design decisions:**
- Homepage loads content immediately — no skeleton loader for a 60-book catalog
- Scroll position preserved on back navigation — no disorienting jump to top
- Empty state provides a clear action (reset filters), not a dead end
- Sélection du mois taps directly to detail — same route as catalog items

---

### Journey 2 — Employee: Filter-Based Browse (Remote, from home)

```mermaid
flowchart TD
    A([Opens portal on laptop\nno VPN]) --> B[Homepage loads]
    B --> C[Scrolls past Sélection du mois]
    C --> D[Taps genre chip: 'Management']
    D --> E[Catalog filtered — 12 results]
    E --> F[Taps year filter: '2020+']
    F --> G[Combined filter — 4 results]
    G --> H[Reads curator note previews]
    H --> I{Book of interest?}
    I -->|Yes| J[Taps book → detail page]
    I -->|No| K[Adjusts filter chips]
    K --> G
    J --> L[Reads full curator note]
    L --> M([Notes to pick up on Thursday])
```

**Key design decisions:**
- Filters are additive chips — tapping multiple chips narrows results progressively
- No "Apply" button — filters apply instantly on tap
- Chip state is visually clear (active terracotta vs. inactive grey)

---

### Journey 3 — Animator: ISBN Scan → Book Live on Portal

```mermaid
flowchart TD
    A([Taps '+' FAB in admin]) --> B[Scan screen opens\nCamera viewfinder active]
    B --> C{Barcode detected?}
    C -->|Yes — within ~2s| D[Viewfinder closes\nForm populates via API]
    C -->|Scan fails / slow| E[User taps 'Saisir manuellement']
    E --> F[ISBN text field focused\nSame form — no new page]
    F --> G[User types ISBN\nTaps 'Rechercher']
    G --> D
    D --> H{API returned data?}
    H -->|Full data| I[All fields pre-filled\nCover thumbnail shown]
    H -->|Partial data| J[Some fields pre-filled\nEmpty fields editable]
    H -->|No data| K[Only ISBN filled\nAll fields editable]
    I --> L[User reviews fields\nEdits if needed]
    J --> L
    K --> L
    L --> M[User writes curator note]
    M --> N{Sélection du mois?}
    N -->|Yes| O[Toggles switch ON]
    N -->|No| P[Leaves toggle OFF]
    O --> Q[Taps 'Enregistrer']
    P --> Q
    Q --> R[Snackbar: 'Livre ajouté ✓']
    R --> S[Form resets for next entry]
    S --> T([Book live on public portal])
```

**Key design decisions:**
- Single screen throughout — scan fail never navigates away
- API partial/no data gracefully shows what's available; all fields remain editable
- Curator note field is the only field with no API source — cursor focus goes there after auto-fill
- Save is fire-and-forget — no confirmation dialog, immediate snackbar feedback

---

### Journey 4 — Animator: Edit an Existing Book

```mermaid
flowchart TD
    A([Admin book list]) --> B[Taps ✏️ on a book]
    B --> C[Edit form pre-filled\nAll fields editable]
    C --> D[User edits desired fields]
    D --> E[Taps 'Enregistrer']
    E --> F[Snackbar: 'Livre mis à jour ✓']
    F --> G([Returns to book list])
```

**Key design decisions:**
- Edit reuses the same form component as Add — no separate design
- No confirmation on save — consistent with the Add flow

---

### Journey Patterns

**Navigation patterns:**
- **Back preserves state:** All back navigations return user to previous scroll position
- **Single route for detail:** Both feature card and catalog items route to the same book detail component (`/livres/:id`)
- **Admin = separate route tree:** `/admin/*` routes are lazy-loaded, never included in the public bundle

**Decision patterns:**
- **Filters are stateless chips:** No apply button — tap to activate, tap to deactivate, results update instantly
- **Scan fallback is inline:** Failure never triggers a route change — manual ISBN field appears within the same view

**Feedback patterns:**
- **Snackbar for all saves:** `mat-snack-bar` bottom confirmation for add and edit — auto-dismisses after 3 seconds
- **Empty states always actionable:** Every empty or error state provides a visible next step

### Flow Optimization Principles

1. **Minimum taps to value:** Homepage → detail is 1 tap; homepage → filtered result → detail is 2 taps
2. **No dead ends:** Every error state has an immediate recovery action visible without scrolling
3. **State preservation on back:** Catalog scroll position persists across detail navigation
4. **Admin flow is linear:** Scan → fill → note → save. No branching on the happy path.

## Component Strategy

### Design System Components (Angular Material M3)

Les composants suivants sont disponibles nativement dans Angular Material et utilisés sans personnalisation structurelle :

| Composant Angular Material | Usage dans le portail |
|---|---|
| `mat-card` | Base pour les cartes de livres (list items et feature cards) |
| `mat-form-field` + `mat-input` | Champs ISBN, titre, auteur, note curateur dans l'admin |
| `mat-chip` / `mat-chip-set` | Filtres actifs, badges genre, puce "Sélection du mois" |
| `mat-fab` (extended) | Bouton "Ajouter un livre" flottant dans l'admin |
| `mat-slide-toggle` | Toggle "Sélection du mois" dans le formulaire admin |
| `mat-snack-bar` | Feedback de confirmation (sauvegarde, suppression, scan réussi) |
| `mat-dialog` | Modale de confirmation de suppression |
| `mat-icon` | Icônes système (search, edit, delete, camera, check) |
| `mat-toolbar` | App bar public + app bar admin |
| `mat-progress-spinner` | Chargement auto-fill ISBN, chargement catalogue |
| `mat-select` | Filtre par genre dans la barre de filtres |
| `mat-button` / `mat-icon-button` | Actions admin (modifier, supprimer, se déconnecter) |

**Couverture :** Angular Material couvre entièrement les primitives de formulaire, navigation et feedback. Les gaps sont concentrés sur les composants métier spécifiques à la médiathèque.

### Custom Components

#### `BookListItemComponent`

**Purpose:** Afficher un livre dans la liste du catalogue public — l'unité de base de la découverte.

**Usage:** Catalogue public, résultats de recherche, liste admin (variante compact).

**Anatomy:**
```
[Cover 72×100px] | [Title (Title medium, bold)]
                 | [Author · Genre · Année (Body medium, muted)]
                 | [Curator note preview — 2 lignes, italique, tronquées]
```

**States:**
- Default — affichage normal
- Hover/focus — légère élévation (`elevation-1`), curseur pointer
- No cover — placeholder warm grey (`#E8E3DD`) avec icône livre centré
- Loading — skeleton shimmer sur cover et lignes de texte

**Variants:**
- `default` — avec note curateur preview (catalogue public)
- `compact` — sans note preview (liste admin)

**Accessibility:** `role="article"`, lien englobant l'item entier avec `aria-label="[Titre] par [Auteur]"`, titre en `h3`.

**Content Guidelines:** La note curateur est tronquée à 2 lignes — elle suscite l'envie sans tout révéler ; le detail page la montre en intégralité.

---

#### `SelectionDuMoisCardComponent`

**Purpose:** Mettre en valeur la sélection éditoriale du mois sur la homepage — le hero visuel de la page.

**Usage:** Homepage uniquement, au-dessus du catalogue.

**Anatomy:**
```
[Badge pill "Sélection du mois" — terracotta background]
[Cover 120×165px, ombre portée légère]
[Titre (Title large, bold)]
[Auteur (Body medium, muted)]
[Note curateur complète (Body large, italique, couleur terracotta clair)]
[→ Voir le livre — lien discret, underline]
```

**States:**
- Single book — card pleine largeur centrée
- Multiple books — scroll horizontal (scroll snap) sur mobile, grille 2-col sur desktop
- Empty — section entière absente du DOM si aucun livre marqué

**Accessibility:** `role="region"` avec `aria-label="Sélection du mois"`, image cover avec `alt="Couverture de [Titre]"`.

---

#### `IsbnScanOverlayComponent`

**Purpose:** Interface de scan de code-barres ISBN dans le navigateur — expérience clé du workflow admin.

**Usage:** Écran d'ajout de livre, admin uniquement.

**Anatomy:**
```
[Viewfinder carré centré, coins arrondis terracotta]
[Ligne de scan animée — haut → bas en boucle]
[Texte guide: "Pointez vers le code-barres ISBN"]
[Bouton secondaire: "Saisir l'ISBN manuellement"]
[Feedback succès: overlay vert + ✓ + ISBN affiché 1 seconde]
```

**States:**
- Scanning — caméra active, animation de scan en cours
- Success — flash vert + ISBN affiché brièvement avant auto-fill du formulaire
- Error (no camera) — message informatif + bascule automatique vers saisie manuelle
- Timeout (30s) — suggestion discrète de saisir manuellement

**Accessibility:** `aria-live="polite"` pour annoncer le succès ou l'erreur. Bouton fallback toujours visible et accessible.

**Technical Note:** `BarcodeDetector` Web API (Chromium 2024+) en priorité ; ZXing-js en fallback navigateur.

---

#### `BookCoverComponent`

**Purpose:** Afficher la couverture d'un livre avec fallback élégant si l'URL est manquante ou cassée.

**Usage:** `BookListItemComponent`, `SelectionDuMoisCardComponent`, page de détail, formulaire admin.

**Anatomy:**
```
<img src="coverUrl" alt="Couverture de [Titre]" />
  — ou, si erreur/absent —
<div placeholder> icône livre + fond primary-container warm </div>
```

**States:**
- Loaded — image affichée, ratio 2:3 respecté (`object-fit: cover`)
- Loading — skeleton shimmer
- Error / No URL — placeholder illustratif couleur chaude, jamais d'icône image cassée

**Variants:** `size="small"` (64×88px), `size="medium"` (96×132px), `size="large"` (120×165px).

**Accessibility:** `alt="Couverture de [Titre]"` ; `alt=""` si l'item parent porte déjà le label complet.

---

#### `FilterBarComponent`

**Purpose:** Permettre la recherche et le filtrage du catalogue en une seule ligne d'interface.

**Usage:** Catalogue public uniquement.

**Anatomy:**
```
[Search input pleine largeur — "Rechercher un livre..."]
[Chip "Genre ▾"] [Chip "Année ▾"] [Chip "× Effacer" — visible si filtre actif]
```

**States:**
- Idle — input vide, chips sans valeur
- Active filter — chip avec valeur sélectionnée, style `primary` rempli
- Results found — catalogue filtré mis à jour en temps réel
- No results — message "Aucun livre trouvé pour cette recherche" avec bouton "Effacer les filtres"

**Accessibility:** `role="search"`, input avec `aria-label="Rechercher dans le catalogue"`, chips avec état `aria-pressed`.

---

### Component Implementation Strategy

**Principe directeur :** Tous les composants personnalisés utilisent exclusivement les CSS custom properties du thème Angular Material M3 — aucune valeur de couleur ou d'espacement en dur. Cela garantit la cohérence visuelle et facilite un éventuel rebranding.

**Structure des fichiers :**
```
src/app/
  shared/
    components/
      book-list-item/           ← BookListItemComponent
      selection-du-mois-card/   ← SelectionDuMoisCardComponent
      isbn-scan-overlay/        ← IsbnScanOverlayComponent
      book-cover/               ← BookCoverComponent
      filter-bar/               ← FilterBarComponent
```

**Architecture :** Tous les composants partagés sont des **standalone components** Angular 17+, exportés individuellement. Pas de `SharedModule`.

**Styling :** CSS custom properties héritées du thème M3 pour les couleurs et espacements. SCSS uniquement pour les helpers structurels (flex, grid, clamp).

### Implementation Roadmap

**Phase 1 — Composants critiques public (sprint 1)**

| Composant | Justification |
|---|---|
| `BookCoverComponent` | Utilisé dans tous les autres composants — blocker |
| `BookListItemComponent` | Corps du catalogue — parcours Karim et Sophie |
| `FilterBarComponent` | Découvrabilité — critère de succès core |
| `SelectionDuMoisCardComponent` | Premier élément visible à l'ouverture du portail |

**Phase 2 — Composants admin (sprint 2)**

| Composant | Justification |
|---|---|
| `IsbnScanOverlayComponent` | Parcours animateur — objectif 60 secondes |
| Formulaire admin (Angular Material natif) | CRUD complet — composants Material suffisants |

**Phase 3 — Affinements (sprint 3+)**

| Composant | Justification |
|---|---|
| Skeleton loaders dans `BookListItemComponent` | Perception de performance sur 4G |
| États vides illustrés | Catalogue vide, aucun résultat de recherche |
| Animation scan success dans `IsbnScanOverlayComponent` | Feedback visuel rassurant et mémorable |

## UX Consistency Patterns

### Button Hierarchy

**Règle principale :** Une seule action primaire par écran. Les actions secondaires et destructives ont des styles distincts.

| Niveau | Style | Usage |
|---|---|---|
| **Primary** | `mat-raised-button`, fond terracotta | Action principale : "Enregistrer", "Se connecter", "Rechercher" |
| **Secondary** | `mat-stroked-button`, outline terracotta | Action alternative : "Saisir manuellement", "Annuler" |
| **Ghost** | `mat-button`, texte terracotta | Navigation discrète : "Voir le livre →", "Admin" |
| **Destructive** | `mat-button` ou `mat-icon-button`, rouge `#B00020` | "Supprimer" — jamais primary, toujours confirmé via dialog |
| **FAB** | `mat-fab` extended, terracotta | Une seule action globale par écran : "Ajouter un livre" |

**Règles :**
- Jamais deux boutons `mat-raised-button` côte à côte
- Le bouton destructif n'est jamais le focus par défaut dans une dialog de confirmation
- Sur mobile, les boutons pleine largeur si l'action est la seule sur l'écran (ex : "Se connecter")

### Feedback Patterns

**Snackbar (confirmations et actions réversibles) :**
- Position : bas de l'écran, centré
- Durée : 3 secondes (auto-dismiss), 6 secondes si action "Annuler" disponible
- Exemples : "Livre ajouté ✓", "Livre supprimé", "Modifications enregistrées ✓"
- Pas de snackbar pour les erreurs critiques — utiliser un inline error à la place

**Inline errors (formulaires) :**
- Sous le champ concerné, rouge `#B00020`, icône ⚠
- Apparaît à la perte de focus (blur) ou à la soumission, jamais en cours de frappe
- Exemple : "ISBN invalide — 13 chiffres attendus"

**Page-level error (API indisponible) :**
- Banner discret sous l'app bar : "Impossible de récupérer les métadonnées. Saisissez les informations manuellement."
- Jamais un écran d'erreur complet — le formulaire reste utilisable

**Scan feedback :**
- Succès : overlay vert 1 seconde + vibration device (si disponible)
- Échec : pas de notification intrusive — le bouton "Saisir manuellement" est toujours visible

### Form Patterns

**Disposition :**
- Formulaires en colonne unique — jamais de layout multi-colonnes sur mobile
- Labels au-dessus du champ (`mat-label` flottant) — pas de placeholders seuls
- Largeur des champs : pleine largeur du conteneur sur mobile ; max 480px sur desktop

**Validation :**
- Validation en temps réel uniquement pour l'ISBN (longueur + format)
- Tous les autres champs : validation à la soumission
- Les champs optionnels sont étiquetés "(optionnel)" — pas d'astérisque pour les requis

**Auto-fill (formulaire ISBN) :**
- Champs pré-remplis mis en évidence visuellement 2 secondes (fond `#F4E4DC`) puis normalisés
- `mat-progress-spinner` inline pendant la requête API
- Tous les champs restent éditables après auto-fill — aucun champ en lecture seule

**Ordre des champs dans le formulaire admin :**
1. ISBN (scan ou saisie)
2. Titre
3. Auteur(s)
4. Genre / Catégorie
5. Année de publication
6. Couverture (URL ou upload)
7. Note du curateur ← focus automatique après auto-fill
8. Sélection du mois (toggle)

### Navigation Patterns

**App bar publique :**
- Logo/nom à gauche ("Médiathèque conviviale")
- Lien "Admin" discret à droite (ghost button, texte seul)
- Pas de hamburger menu — le portail n'a pas de navigation secondaire

**App bar admin :**
- Fond sombre (`#1A1A1A`) pour différenciation visuelle immédiate
- Titre de la page courante au centre
- Icône de déconnexion à droite

**Retour en arrière :**
- Bouton `←` dans l'app bar sur les pages de détail et d'édition
- Retour vers la liste avec préservation du scroll (Angular Router scroll restoration)
- Jamais de `window.history.back()` — toujours un lien de retour explicite

**Routing :**
- `/` → Homepage publique
- `/livres/:id` → Détail d'un livre
- `/admin` → Liste admin (route guardée)
- `/admin/livres/nouveau` → Formulaire d'ajout
- `/admin/livres/:id/modifier` → Formulaire d'édition
- `/admin/login` → Authentification

### Modal & Overlay Patterns

**Confirmation de suppression (`mat-dialog`) :**
- Titre : "Supprimer ce livre ?"
- Corps : titre du livre entre guillemets pour contextualiser
- Actions : "Annuler" (secondary, focus par défaut) | "Supprimer" (destructive rouge)
- Jamais de suppression directe sans confirmation dialog

**IsbnScanOverlay :**
- Plein écran sur mobile — pas de dialog flottante
- Fermeture : bouton ✕ en haut à droite, ou scan réussi (fermeture automatique)
- Pas de tooltips : le portail est assez simple pour que les labels soient toujours visibles

### Empty States & Loading States

**États vides :**

| Contexte | Message | Action proposée |
|---|---|---|
| Catalogue vide | "La médiathèque est vide pour l'instant." | Aucune (public) / "Ajouter un livre" (admin) |
| Aucun résultat de recherche | "Aucun livre ne correspond à votre recherche." | Bouton "Effacer les filtres" |
| Sélection du mois vide | Section absente — pas de message | N/A |

**États de chargement :**
- Catalogue : skeleton list de 3–4 items avec shimmer
- Auto-fill ISBN : spinner inline dans les champs + label "Recherche en cours…"
- Couverture : skeleton carré avant chargement de l'image
- Transitions entre routes : pas de spinner de page — les composants gèrent leur propre état

### Search & Filtering Patterns

**Comportement :**
- Recherche full-text : debounce 300ms — pas de bouton "Rechercher" pour le catalogue
- Filtres genre/année : chips avec activation/désactivation par tap, résultats immédiats
- Les filtres s'accumulent (AND logique)
- Chip "× Effacer tout" visible dès qu'au moins un filtre est actif

**URL state :** Les filtres actifs ne sont pas reflétés dans l'URL pour le MVP — état local au composant.

**Empty filter state :** Si la combinaison donne 0 résultats, les chips restent actifs — l'utilisateur voit ce qu'il a sélectionné et peut le modifier sans que les filtres s'auto-retirent.

## Responsive Design & Accessibility

### Responsive Strategy

**Approche mobile-first.** La majorité des employés découvrent le portail via QR code — sur téléphone. La conception part du petit écran et s'enrichit vers le grand.

**Public catalog (priorité 1 — mobile) :**
- Single column tout au long — pas de passage en grille sur desktop (60 livres ne justifient pas une grille)
- Cover + texte en ligne horizontale sur tous les breakpoints — la disposition change de taille, pas de structure
- `SelectionDuMoisCardComponent` pleine largeur sur mobile, max 600px centré sur desktop
- Scroll vertical — l'utilisateur fait défiler, pas de pagination

**Admin interface (priorité 2 — smartphone portrait) :**
- Formulaire pleine largeur, single column obligatoire
- Scan overlay plein écran sur mobile — le viewfinder a besoin de tout l'espace disponible
- FAB positionné bas-droit, `position: fixed`, au-dessus du contenu scrollable

**Desktop adaptation (bonus, pas critique) :**
- Contenu centré avec `max-width: 800px` — pas de layout multi-colonnes
- Hover states activés sur les book list items
- Curseur pointer sur les éléments cliquables

### Breakpoint Strategy

Alignés sur les breakpoints Angular Material CDK par défaut :

| Breakpoint | Plage | Comportement |
|---|---|---|
| **Mobile** | < 600px | Layout de base, covers 72×100px, marges 16px |
| **Tablet** | 600px – 960px | Marges 24px, covers 96×132px, max-width 720px centré |
| **Desktop** | > 960px | max-width 800px centré, hover states, covers inchangées |

**Règle clé :** Les seuls changements cross-breakpoint sont les marges, la taille des covers, et le centrage du contenu. Pas de réorganisation structurelle — la hiérarchie visuelle est identique sur tous les écrans.

**Media queries :** Mobile-first, `min-width` uniquement. Styles de base pour `< 600px` ; overrides à `≥ 600px` puis `≥ 960px`.

### Accessibility Strategy

**Niveau cible :** Pas de conformité WCAG formelle requise pour le MVP (décision explicite). Angular Material M3 constitue un socle solide par défaut.

**Garanti by design :**

| Critère | Implémentation |
|---|---|
| Contraste couleur | `#1A1A1A` sur `#F8F5F0` → ratio 14:1 ✓ ; `#B85C38` sur blanc → ratio 4.6:1 ✓ (AA) |
| Touch targets | Angular Material garantit 44×44px minimum sur tous les composants interactifs |
| Alt text images | `BookCoverComponent` injecte `alt="Couverture de [Titre]"` systématiquement |
| Labels formulaires | `mat-label` flottant sur tous les champs — pas de placeholder-only |
| Focus visible | Angular Material M3 — indicateur de focus natif activé |
| Navigation clavier | `mat-chip-set`, `mat-form-field`, `mat-dialog` — clavier inclus nativement |

**Non requis (décision explicite) :** skip links, support screen reader testé formellement, mode contraste élevé, WCAG AAA.

**ARIA usage :**
- `role="region"` + `aria-label` sur la section "Sélection du mois"
- `aria-live="polite"` sur les feedbacks de scan ISBN
- `aria-label` sur les `mat-icon-button` sans texte visible (modifier, supprimer)

### Testing Strategy

**Responsive testing :**
- Chrome DevTools device emulation — iPhone 12/14, Samsung Galaxy S21, iPad
- Test réel sur l'appareil du développeur avant lancement
- Safari iOS — testé avant lancement (comportement caméra/BarcodeDetector à valider)
- Firefox et Edge — smoke test visuel uniquement

**ISBN scan testing spécifique :**
- Test avec `BarcodeDetector` (Chrome/Edge) — livres réels de la médiathèque
- Test ZXing-js fallback sur Safari iOS
- Test en conditions de lumière variable (bibliothèque physique)
- Validation du chemin fallback "saisie manuelle" sur mobile

**Accessibilité (scope minimal) :**
- Navigation clavier complète sur les formulaires admin — vérification manuelle
- Vérification visuelle des contrastes sur le détail du livre
- Pas d'audit automatisé (axe, Lighthouse) obligatoire pour le MVP

### Implementation Guidelines

**Responsive development :**

```scss
// Mobile-first breakpoints (Angular Material CDK)
.page-container {
  padding: 0 16px;            // mobile base
  @media (min-width: 600px) { padding: 0 24px; max-width: 720px; margin: auto; }
  @media (min-width: 960px) { max-width: 800px; }
}
// Tailles covers via BookCoverComponent @Input size — jamais en CSS ad hoc
```

**Unités CSS :**
- `rem` pour la typographie (base 16px)
- `px` pour les covers et espacements fixes (valeurs design system)
- `%` ou `max-width` pour les conteneurs fluides
- Jamais `px` pour la taille de police de base

**Scan overlay :**
- Toujours plein écran — `position: fixed; inset: 0`
- `getUserMedia` demandé uniquement au tap "Scanner" — pas au chargement de la page
- Détection `BarcodeDetector` → ZXing-js à l'initialisation du composant

**Images :**
- `object-fit: cover` sur toutes les couvertures — ratio 2:3 préservé
- `loading="lazy"` sur les covers hors visible fold
- Covers Open Library via CDN externe — pas de proxy backend (NFR3)

**Focus management admin :**
- Après auto-fill ISBN → focus automatique sur "Note du curateur"
- Après sauvegarde → retour focus sur le FAB "Ajouter un livre"
- Après fermeture dialog → focus retour sur l'élément déclencheur

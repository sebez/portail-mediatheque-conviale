---
stepsCompleted: ["step-01-validate-prerequisites", "step-02-design-epics", "step-03-create-stories", "step-04-final-validation"]
inputDocuments:
  - "_bmad-output/planning-artifacts/prd.md"
  - "_bmad-output/planning-artifacts/architecture.md"
  - "_bmad-output/planning-artifacts/ux-design-specification.md"
---

# Portail Médiathèque Conviviale - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Portail Médiathèque Conviviale, decomposing the requirements from the PRD, UX Design, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Any visitor can browse the complete book catalog without authentication
FR2: Any visitor can view book cover images alongside catalog entries
FR3: Any visitor can filter the catalog by title
FR4: Any visitor can filter the catalog by author
FR5: Any visitor can filter the catalog by genre/category
FR6: Any visitor can filter the catalog by publication year
FR7: Any visitor can search the catalog using a free-text keyword across all fields
FR8: Any visitor can combine multiple filters simultaneously
FR9: Any visitor can access the portal from any device without VPN or corporate network access
FR10: Any visitor can view a book's full detail page: title, author, genre, publication year, cover image, and curator note
FR11: Any visitor can navigate from a catalog entry to the book's detail page
FR12: The system displays the curator's personal note for each book on its detail page
FR13: Any visitor can see a "Recently Added" section on the homepage, sorted by `date_added DESC`
FR14: Any visitor can see a "Sélection du mois" section on the homepage showing admin-featured books
FR15: The "Sélection du mois" section displays featured books with cover, title, and curator note
FR16: An admin can log in with a dedicated username and password — no SSO, no corporate identity
FR17: The system enforces role-based access control — only authenticated admins can access the admin interface
FR18: Multiple admins can hold active accounts simultaneously
FR19: An admin can log out of the admin interface
FR20: An admin can add a new book to the catalog
FR21: An admin can edit any field of an existing book
FR22: An admin can delete a book from the catalog
FR23: An admin can write and edit a curator note for any book
FR24: An admin can mark a book as the "Sélection du mois"
FR25: An admin can remove the "Sélection du mois" flag from a book
FR26: The system stores a `status` field on each book entity to support future availability tracking without a schema migration
FR27: An admin can scan a book's ISBN barcode using a smartphone camera directly in the browser
FR28: An admin can enter an ISBN manually as a fallback when barcode scanning fails
FR29: The system auto-fills book metadata from Open Library using the scanned or entered ISBN
FR30: The system falls back to Google Books API when Open Library returns no or incomplete data
FR31: An admin can override any auto-filled field before saving
FR32: The system displays a cover image retrieved from Open Library when available
FR33: An admin can save a new book record with only partially auto-filled data
FR34: Each book record stores: ISBN, title, author(s), genre/category, publication year, cover image URL, curator note, date added, Sélection du mois flag, and status
FR35: The system records the date a book was added to the catalog automatically

### NonFunctional Requirements

NFR1: The public catalog page must reach interactive state in under 3 seconds on a standard 4G mobile connection
NFR2: Filter and search operations must return results within 1 second for a catalog of up to 500 books
NFR3: Cover images are served from Open Library CDN — the API backend must not proxy image files
NFR4: The admin ISBN scan → auto-fill → save sequence must complete in under 60 seconds under normal network conditions
NFR5: All traffic must be served over HTTPS — no plain HTTP in production
NFR6: Admin passwords stored as salted hashes (bcrypt or equivalent) — no plain text
NFR7: JWT tokens expire after 8 hours; refresh token optional for v1
NFR8: Admin API endpoints return HTTP 401 for unauthenticated requests
NFR9: Internal error details and stack traces must not be exposed to the browser in production
NFR10: Open Library API unavailability must not block the admin from saving a book manually
NFR11: Google Books API unavailability must not block the admin from saving a book manually
NFR12: Google Books API key stored as environment variable — not hardcoded in source
NFR13: Cover image URLs validated before storage — broken URLs must not surface on the public catalog
NFR14: Application targets ≥99% monthly uptime on OVH or Scaleway VPS
NFR15: SQLite database file backed up daily minimum
NFR16: Application restarts automatically after a crash (Docker restart policy)

### Additional Requirements

- **Starter template (first story):** Separate scaffolding — `ng new portail-mediatheque-frontend --routing --style=scss` + `dotnet new webapi -n PortailMediatheque.Api --no-https --use-controllers` + `dotnet new xunit -n backend.Tests`; monorepo structure: `frontend/`, `backend/`, `backend.Tests/`, `docker-compose.yml`, `nginx/`
- EF Core 10 with SQLite provider; auto-applied migrations via `context.Database.Migrate()` on startup; `Book` and `AdminUser` entities
- `BCrypt.Net-Next` for password hashing; admin credentials seeded from environment variables on first startup (check `AdminUsers` table empty → hash env credentials → insert)
- JWT via `Microsoft.AspNetCore.Authentication.JwtBearer`; 8-hour expiry; `localStorage` storage in Angular + HTTP interceptor attaching `Authorization: Bearer` header
- Angular Material M3 added post-init via `ng add @angular/material`; warm terracotta custom palette configured at setup
- nginx reverse proxy for TLS termination; Docker Compose (`docker-compose.yml` prod + `docker-compose.override.yml` dev) with named Docker volume for SQLite persistence
- Global `ExceptionHandlingMiddleware` (no stack traces in production); ProblemDetails (RFC 7807) format for all API errors
- Cover URL HTTP HEAD check before storage (`BookService.CreateAsync`); `BookCoverComponent` graceful fallback at render time
- `BarcodeDetector` Web API (Chromium 2024+) as primary scanner; ZXing-js as fallback for Safari iOS
- External API resilience: 5-second timeout per call; fallback chain Open Library → Google Books → manual entry; never throw on API failure — always return partial/empty DTO
- Angular Router `scrollPositionRestoration: 'enabled'` in `app.config.ts`
- OpenAPI/Swagger enabled in development, disabled in production
- Host cron job copying named Docker volume SQLite file daily to timestamped path
- `restart: unless-stopped` in `docker-compose.yml`
- `IsbnController` is `[Authorize]` — called only from admin context
- All controller actions async; all service methods suffixed `Async`; camelCase JSON fields (System.Text.Json default)
- CORS origins driven by environment variable; `http://localhost:4200` in dev, production domain in prod

### UX Design Requirements

UX-DR1: Implement the warm editorial color palette using Angular Material M3 CSS custom properties: `--color-background: #F8F5F0`, `--color-surface: #FFFFFF`, `--color-on-surface: #1A1A1A`, `--color-on-surface-variant: #6B6561`, `--color-primary: #B85C38`, `--color-primary-container: #F4E4DC`, `--color-outline: #E8E3DD`, `--color-error: #BA1A1A`, `--color-success: #386A20`
UX-DR2: Implement the Inter font with system stack fallback (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`); curator note text must use Body large style (16px, weight 400, line-height 1.6)
UX-DR3: Implement `BookCoverComponent` (standalone) with three sizes (small: 64×88px, medium: 96×132px, large: 120×165px), skeleton shimmer loading state, and warm grey placeholder (`#E8E3DD`) with book icon for missing/broken covers — never a broken image icon
UX-DR4: Implement `BookListItemComponent` (standalone) showing cover (left, 72×100px) + title/author/genre + 2-line clamped curator note preview, with `default` and `compact` variants; accessible with `role="article"` and `aria-label="[Titre] par [Auteur]"`
UX-DR5: Implement `SelectionDuMoisCardComponent` (standalone) as a full-width feature card with badge pill "Sélection du mois", month label (e.g., "Avril 2026"), large cover (120×165px), title, author, full curator note, and "Voir le livre →" link; multiple books via horizontal scroll snap on mobile and 2-col grid on desktop; section absent from DOM if no books are featured; `role="region"` + `aria-label="Sélection du mois"`
UX-DR6: Implement `FilterBarComponent` (standalone) with full-width search input (debounce 300ms, no "Apply" button), genre chip selector, year chip selector, and "× Effacer tout" chip visible when any filter is active; results update in real time; `role="search"` and `aria-label="Rechercher dans le catalogue"` on input; chips with `aria-pressed` state
UX-DR7: Implement `IsbnScanOverlayComponent` (standalone) as full-screen overlay (`position: fixed; inset: 0`) with animated scan line (top→bottom loop), terracotta viewfinder corners, `BarcodeDetector` Web API (primary) + ZXing-js (fallback), 4 states: scanning / success (green overlay + ✓ + ISBN displayed 1 second + device vibration) / no-camera (informative message + auto-switch to manual) / timeout (30s discreet suggestion); `aria-live="polite"` for feedback; `getUserMedia` requested only on tap, not on page load
UX-DR8: Implement homepage two-zone layout: `SelectionDuMoisCardComponent` at top (hidden if no featured books), then "Recently Added" section (most recent books, `date_added DESC`), then `FilterBarComponent`, then full catalog list (vertical scroll, single column on all breakpoints); no skeleton loader for catalog (60-book collection loads fast enough)
UX-DR9: Implement mobile-first responsive layout using Angular Material CDK breakpoints: mobile (<600px, 16px margins), tablet (600–960px, 24px margins, max-width 720px centered), desktop (>960px, max-width 800px centered); all breakpoint changes via `min-width` media queries only; cover sizes adapt per breakpoint via `BookCoverComponent` `@Input size`; single-column layout on all breakpoints (no grid at desktop)
UX-DR10: Implement admin interface with dark app bar (`#1A1A1A`) for immediate visual context separation from public interface; fixed FAB ("+ Ajouter un livre", `mat-fab` extended, `position: fixed bottom-right`) on book list view; admin form fields single-column, full width; `mat-slide-toggle` for Sélection du mois flag; `mat-snack-bar` (3 seconds auto-dismiss) for all save/edit confirmations
UX-DR11: Implement deletion confirmation via `mat-dialog`: title "Supprimer ce livre?", body with book title in quotes for context, "Annuler" (secondary, focused by default) | "Supprimer" (destructive `#B00020`) buttons; never allow direct deletion without this dialog
UX-DR12: Implement admin book form field order: ISBN (scan or manual) → Titre → Auteur(s) → Genre/Catégorie → Année → Couverture (URL) → Note du curateur → Sélection du mois (toggle); auto-fill highlights pre-filled fields for 2 seconds with `#F4E4DC` background before normalizing; `mat-progress-spinner` inline during API lookup; auto-focus on "Note du curateur" field after auto-fill completes
UX-DR13: Implement scroll position restoration on back navigation using Angular Router `scrollPositionRestoration: 'enabled'`; book detail and edit form pages must show back button (`←`) in app bar linking explicitly to the previous list; never use `window.history.back()`; after admin save → focus returns to FAB; after dialog close → focus returns to triggering element
UX-DR14: Implement footer freshness signal: dynamically populated "X livres dans la collection · Mis à jour le [date]" line using API data; "Sélection du mois" card must display a month label ("Avril 2026" format)
UX-DR15: Implement all empty states: catalog empty → "La médiathèque est vide pour l'instant." (no action for public, "Ajouter un livre" for admin); no search results → "Aucun livre ne correspond à votre recherche." + "Effacer les filtres" button; Sélection du mois empty → section absent from DOM (no placeholder)
UX-DR16: Implement button hierarchy throughout: one primary `mat-raised-button` (terracotta) per screen max; secondary actions use `mat-stroked-button`; navigation uses `mat-button` ghost; destructive actions use red `#B00020` `mat-button` or `mat-icon-button`, never as default focus in dialog; FAB for single global add action
UX-DR17: Portal wordmark "Médiathèque conviviale" in public app bar with accent color (`#B85C38`) on "conviviale"; discreet "Admin" ghost button link in top-right of public app bar (visible but unobtrusive to visitors)

### FR Coverage Map

```
FR1:  Epic 2 — Public catalog browsing without auth
FR2:  Epic 2 — Cover images in catalog
FR3:  Epic 3 — Filter by title
FR4:  Epic 3 — Filter by author
FR5:  Epic 3 — Filter by genre/category
FR6:  Epic 3 — Filter by publication year
FR7:  Epic 3 — Free-text keyword search
FR8:  Epic 3 — Combined filters
FR9:  Epic 2 — No VPN, public URL
FR10: Epic 2 — Book detail page
FR11: Epic 2 — Navigation catalog → detail
FR12: Epic 2 — Curator note on detail page
FR13: Epic 2 — "Recently Added" homepage section
FR14: Epic 2 — "Sélection du mois" homepage section
FR15: Epic 2 — Sélection du mois with cover + note
FR16: Epic 4 — Admin login (dedicated credentials)
FR17: Epic 4 — RBAC, admin-only interface
FR18: Epic 4 — Multiple admin accounts
FR19: Epic 4 — Admin logout
FR20: Epic 5 — Add book
FR21: Epic 5 — Edit book (all fields)
FR22: Epic 5 — Delete book
FR23: Epic 5 — Write/edit curator note
FR24: Epic 5 — Mark as Sélection du mois
FR25: Epic 5 — Remove Sélection du mois flag
FR26: Epic 5 — Status field (Phase 2 forward-compat)
FR27: Epic 6 — ISBN barcode scan in browser
FR28: Epic 6 — Manual ISBN entry fallback
FR29: Epic 6 — Open Library auto-fill
FR30: Epic 6 — Google Books fallback
FR31: Epic 6 — Manual override on auto-filled fields
FR32: Epic 6 — Cover image from Open Library
FR33: Epic 6 — Save with partial auto-fill data
FR34: Epic 1 — Book entity (complete data model)
FR35: Epic 1 — Automatic date_added
```

## Epic List

### Epic 1: Project Foundation & Deployable Infrastructure
The application skeleton is scaffolded, running locally, and deployable to production — the foundation every subsequent epic builds on.
**FRs covered:** FR34, FR35
**NFRs covered:** NFR5, NFR14, NFR15, NFR16
**Arch:** Monorepo scaffold (ng new + dotnet new webapi + dotnet new xunit), EF Core + SQLite, Angular Material M3 warm theme, Docker Compose + nginx, admin credential seeding

### Epic 2: Public Book Catalog — Browse & Discover
Any employee can open the portal without login or VPN, browse the full catalog with covers and curator notes, see the homepage editorial sections ("Recently Added" + "Sélection du mois"), and read a book's full detail page.
**FRs covered:** FR1, FR2, FR9, FR10, FR11, FR12, FR13, FR14, FR15
**NFRs covered:** NFR1, NFR3
**UX-DRs:** UX-DR1–5, UX-DR8–9, UX-DR13–15, UX-DR17

### Epic 3: Catalog Search & Filtering
Employees can find specific books using keyword search and filter by title, author, genre, and year — individually or in combination — with instant results.
**FRs covered:** FR3, FR4, FR5, FR6, FR7, FR8
**NFRs covered:** NFR2
**UX-DRs:** UX-DR6, UX-DR15 (no-results empty state)

### Epic 4: Admin Authentication
The library animator can securely log in to the admin interface with dedicated credentials and log out — with no SSO dependency and full security enforcement.
**FRs covered:** FR16, FR17, FR18, FR19
**NFRs covered:** NFR6, NFR7, NFR8, NFR9
**UX-DRs:** UX-DR10 (dark admin app bar)

### Epic 5: Book Management — Admin CRUD
The animator can add, edit, and delete books from a smartphone, write curator notes, and manage the "Sélection du mois" flag — with immediate confirmation and no friction.
**FRs covered:** FR20, FR21, FR22, FR23, FR24, FR25, FR26
**NFRs covered:** NFR9
**UX-DRs:** UX-DR10, UX-DR11, UX-DR12 (form without ISBN scan), UX-DR13, UX-DR15, UX-DR16

### Epic 6: ISBN Scan & Metadata Auto-Fill
The animator can scan a book's barcode with a smartphone camera and have metadata auto-filled from Open Library (or Google Books as fallback) — completing the full add-book flow in under 60 seconds, with graceful degradation if any API fails.
**FRs covered:** FR27, FR28, FR29, FR30, FR31, FR32, FR33
**NFRs covered:** NFR4, NFR10, NFR11, NFR12, NFR13
**UX-DRs:** UX-DR7, UX-DR12 (auto-fill highlight + auto-focus)

---

## Epic 1: Project Foundation & Deployable Infrastructure

The application skeleton is scaffolded, running locally in dev, and deployable to production — the foundation every subsequent epic builds on.

### Story 1.1: Scaffold Frontend & Backend Projects

As a developer,
I want the monorepo scaffolded with Angular frontend, .NET backend, and test project configured,
So that the team has a clean, runnable baseline with the Angular Material M3 warm editorial theme in place.

**Acceptance Criteria:**

**Given** the repository is cloned
**When** a developer runs `npm install` in `frontend/` and `dotnet restore` in `backend/`
**Then** `ng serve` starts on `localhost:4200` and `dotnet run` starts on `localhost:5000` without errors
**And** `ng build` produces a static output in `frontend/dist/`
**And** `dotnet test` in `backend.Tests/` runs successfully (zero tests initially is acceptable)

**Given** the Angular app is running
**When** a user opens `localhost:4200`
**Then** the public app bar renders "Médiathèque conviviale" wordmark with "conviviale" in terracotta (`#B85C38`) and a discreet "Admin" ghost button in the top-right
**And** the page background is warm parchment (`#F8F5F0`), Inter font is loaded, and Angular Material M3 terracotta theme is applied globally

**Given** the backend is running
**When** `GET /swagger` is accessed in development
**Then** the Swagger UI is rendered
**And** `GET /swagger` in production returns 404 (Swagger disabled in production)

### Story 1.2: Data Model, Database Setup & Admin Credential Seeding

As a developer,
I want the complete book and admin user data model created in SQLite with EF Core migrations auto-applied on startup and admin credentials seeded from environment variables,
So that all subsequent epics have a stable database foundation and the first admin account is ready without a manual setup step.

**Acceptance Criteria:**

**Given** the backend starts with `ADMIN_USERNAME` and `ADMIN_PASSWORD` environment variables set
**When** the application initializes
**Then** EF Core migrations run automatically (`context.Database.Migrate()`) and the `Books` and `AdminUsers` tables are created
**And** if no AdminUser exists, one is created with the BCrypt-hashed password from `ADMIN_PASSWORD`
**And** subsequent restarts do not create duplicate admin users (idempotent seed)

**Given** the `Books` table exists
**When** inspecting the schema
**Then** it has all fields from FR34: `Id`, `Isbn`, `Title`, `Author`, `Genre`, `PublicationYear`, `CoverImageUrl`, `CuratorNote`, `DateAdded`, `IsSelectionDuMois`, `Status`
**And** `DateAdded` is of type `DateTime`, `IsSelectionDuMois` is `bool`, and `Status` is `string` (defaulting to `"available"`)

**Given** the JWT middleware is configured
**When** the backend starts
**Then** JWT authentication with 8-hour expiry is registered in the DI pipeline and ready for use by Epic 4

### Story 1.3: Global Exception Handling Middleware

As a developer,
I want a global exception handler that returns RFC 7807 ProblemDetails responses without stack traces in production,
So that NFR9 is satisfied and all future API errors follow a consistent, safe format.

**Acceptance Criteria:**

**Given** any unhandled exception is thrown in a controller or service
**When** the environment is `Production`
**Then** the API returns HTTP 500 with a ProblemDetails body (`type`, `title`, `status`, `detail`) and no stack trace
**And** the response `Content-Type` is `application/problem+json`

**Given** an unhandled exception occurs
**When** the environment is `Development`
**Then** the full exception detail is visible in the response for debugging

**Given** a request is made to an `[Authorize]`-protected route without a token
**When** the middleware pipeline processes it
**Then** HTTP 401 is returned — confirming the `[Authorize]` + middleware pipeline ordering is correct

### Story 1.4: Docker Compose & Production Deployment Configuration

As a developer,
I want Docker Compose, nginx, and Dockerfiles configured so the app can be deployed to an OVH/Scaleway VPS with a single command,
So that NFR5 (HTTPS), NFR14 (uptime), NFR15 (backup), and NFR16 (auto-restart) are satisfied before any feature epic is built.

**Acceptance Criteria:**

**Given** a `.env` file is populated from `.env.example`
**When** `docker compose up -d --build` runs on the VPS
**Then** the Angular SPA is served by nginx on port 443 with TLS termination
**And** HTTP requests on port 80 are redirected to HTTPS
**And** requests to `/api/*` are proxied to the backend container with the `/api` prefix stripped

**Given** a backend container crash occurs
**When** Docker detects it
**Then** the container restarts automatically (`restart: unless-stopped`)
**And** the SQLite database file persists across restarts (stored in a named Docker volume, not in the image layer)

**Given** the daily backup cron is configured on the host
**When** it runs
**Then** the SQLite named volume file is copied to a timestamped path on the host

**Given** the dev override file exists
**When** `docker compose up` runs locally (without explicitly specifying the production file)
**Then** the dev ports and dev environment variables apply (Compose override convention)

---

## Epic 2: Public Book Catalog — Browse & Discover

Any employee can open the portal without login or VPN, browse the full catalog with covers and curator notes, see the homepage editorial sections ("Recently Added" + "Sélection du mois"), and read a book's full detail page.

### Story 2.1: Public Books API — List & Detail Endpoints

As a developer,
I want the public backend API endpoints for listing and retrieving books,
So that frontend components in subsequent stories have a working data source.

**Acceptance Criteria:**

**Given** books exist in the database
**When** `GET /api/books` is called (no auth required)
**Then** HTTP 200 is returned with an array of all books as `BookDto` objects in camelCase JSON
**And** the response includes all FR34 fields: `isbn`, `title`, `author`, `genre`, `publicationYear`, `coverImageUrl`, `curatorNote`, `dateAdded`, `isSelectionDuMois`, `status`
**And** books are sortable by `dateAdded DESC` via a query parameter

**Given** a book with a specific id exists
**When** `GET /api/books/{id}` is called (no auth required)
**Then** HTTP 200 is returned with the full `BookDto` for that book

**Given** no book exists for the requested id
**When** `GET /api/books/{id}` is called
**Then** HTTP 404 with a ProblemDetails body is returned

**Given** `isSelectionDuMois=true` is passed as a query parameter
**When** `GET /api/books?isSelectionDuMois=true` is called
**Then** only books with `IsSelectionDuMois = true` are returned

**Given** the database is empty
**When** `GET /api/books` is called
**Then** HTTP 200 with an empty array `[]` is returned (never `null`)

### Story 2.2: BookCoverComponent — Shared Cover Display with Graceful Fallback

As any user viewing a book,
I want book covers to display in consistent sizes with a warm placeholder when no cover is available,
So that the catalog never shows broken image icons and always looks polished.

**Acceptance Criteria:**

**Given** a valid cover image URL is provided
**When** `BookCoverComponent` renders
**Then** the image is displayed with `object-fit: cover` preserving the 2:3 ratio
**And** a skeleton shimmer is shown while the image loads

**Given** the cover URL is missing or returns an HTTP error
**When** `BookCoverComponent` renders
**Then** a warm grey (`#E8E3DD`) placeholder with a centered book icon is shown — never a broken image icon

**Given** the component receives `size="small"` (64×88px), `size="medium"` (96×132px), or `size="large"` (120×165px)
**When** it renders
**Then** the correct pixel dimensions are applied via the `@Input size` property

**Given** the component is used in a context where the parent carries the full accessible label
**When** `alt=""` is passed
**Then** the image is decorative (empty alt); otherwise `alt="Couverture de [title]"` is set

### Story 2.3: Book List View — Catalog Page with BookListItemComponent

As an employee,
I want to see the full book catalog as a vertically scrollable list with covers and curator note previews,
So that I can browse what's available and decide what to read without visiting the library.

**Acceptance Criteria:**

**Given** the catalog has books
**When** a user opens `/`
**Then** all books are displayed as a vertical list, each item showing: cover (left, 72×100px), title, author, genre, and a 2-line clamped curator note preview

**Given** a book list item is displayed with no cover
**When** it renders
**Then** the `BookCoverComponent` warm placeholder is shown (no broken icon)

**Given** the catalog is viewed on mobile (< 600px)
**Then** the layout uses 16px horizontal margins, single column
**Given** viewed on tablet (600–960px)
**Then** max-width 720px centered
**Given** viewed on desktop (> 960px)
**Then** max-width 800px centered

**Given** the database has no books
**When** the catalog section renders
**Then** "La médiathèque est vide pour l'instant." is displayed with no action link for public users

**Given** each `BookListItemComponent`
**When** rendered
**Then** it has `role="article"` and `aria-label="[Titre] par [Auteur]"`

### Story 2.4: Book Detail Page

As an employee,
I want to open a book's full detail page with its cover, metadata, and the curator's complete note,
So that I can read the animator's recommendation before deciding to pick the book up.

**Acceptance Criteria:**

**Given** a user taps a book in the catalog list
**When** they navigate to `/livres/:id`
**Then** the detail page shows: large cover (`size="large"`, 120×165px), title, author, genre, publication year, and the full curator note in Body large style (16px, line-height 1.6)

**Given** the detail page is open
**When** the user taps the back button (`←`) in the app bar
**Then** they return to the homepage catalog list with scroll position preserved (Angular Router `scrollPositionRestoration: 'enabled'`)

**Given** an invalid book id is used in the URL
**When** the detail page loads
**Then** a "Livre introuvable" message is shown with a link back to the catalog — no broken page

**Given** the book has no cover URL or a broken URL
**When** the detail page renders
**Then** the `BookCoverComponent` warm placeholder is shown

### Story 2.5: Homepage — Sélection du Mois Feature Card, Recently Added & Footer

As an employee,
I want the homepage to prominently display the "Sélection du mois" editorial pick and the most recently added books,
So that every visit shows me what the curator recommends and what's new.

**Acceptance Criteria:**

**Given** at least one book has `isSelectionDuMois = true`
**When** the homepage loads
**Then** `SelectionDuMoisCardComponent` is rendered at the top with: a terracotta "Sélection du mois" badge pill, a month label ("Avril 2026" format), cover at 120×165px, title, author, full curator note in Body large italic, and a "Voir le livre →" ghost link

**Given** no book has `isSelectionDuMois = true`
**When** the homepage loads
**Then** the Sélection du mois section is entirely absent from the DOM

**Given** multiple books are featured
**When** viewed on mobile
**Then** they display in a horizontal scroll snap container; on desktop in a 2-column grid

**Given** books with recent `dateAdded` values exist
**When** the "Recently Added" section renders
**Then** the 5 most recently added books are shown sorted by `dateAdded DESC` using `BookListItemComponent`

**Given** the footer area
**When** the homepage renders
**Then** "X livres dans la collection · Mis à jour le [date]" is displayed, dynamically populated from the API response

---

## Epic 3: Catalog Search & Filtering

Employees can find specific books using keyword search and filter by title, author, genre, and year — individually or in combination — with instant results.

### Story 3.1: Backend Search & Filter API

As a developer,
I want the `GET /api/books` endpoint to accept query parameters for filtering and keyword search,
So that the frontend can retrieve targeted results without client-side data manipulation.

**Acceptance Criteria:**

**Given** `GET /api/books` is called with `?title=architecture`
**When** the query is processed
**Then** only books whose title contains "architecture" (case-insensitive) are returned

**Given** `GET /api/books` is called with `?author=larson`
**When** the query is processed
**Then** only books whose author field contains "larson" (case-insensitive) are returned

**Given** `GET /api/books` is called with `?genre=management`
**When** the query is processed
**Then** only books whose genre matches "management" (case-insensitive) are returned

**Given** `GET /api/books` is called with `?year=2020`
**When** the query is processed
**Then** only books published in 2020 are returned

**Given** `GET /api/books` is called with `?keyword=equipe`
**When** the query is processed
**Then** books where "equipe" appears in title, author, genre, or curator note are returned (case-insensitive, across all text fields)

**Given** multiple filter parameters are combined (e.g., `?genre=management&year=2023`)
**When** the query is processed
**Then** only books matching ALL conditions (AND logic) are returned

**Given** no books match the applied filters
**When** the query is processed
**Then** HTTP 200 with an empty array `[]` is returned (never a 404)

**Given** a filter query returns results from a 500-book catalog
**When** the response is measured
**Then** it completes within 1 second (NFR2)

### Story 3.2: FilterBarComponent & Frontend Filter Integration

As an employee,
I want a search bar and filter chips on the catalog page to instantly narrow the book list,
So that I can find a specific book without scrolling the entire catalog.

**Acceptance Criteria:**

**Given** the catalog page is loaded
**When** a user types in the search input
**Then** results update in real time with a 300ms debounce — no "Search" button needed
**And** the catalog list below reflects the filtered results immediately

**Given** the user selects a genre from the genre chip selector
**When** the chip is activated
**Then** the catalog is filtered to books of that genre
**And** the chip displays in active style (terracotta filled vs. inactive grey)

**Given** the user selects a year from the year chip selector
**When** the chip is activated
**Then** the catalog is filtered to books published that year
**And** both genre and year filters are applied simultaneously (AND logic)

**Given** at least one filter is active
**When** the filter bar renders
**Then** a "× Effacer tout" chip appears; tapping it clears all active filters and resets the catalog

**Given** the active filter combination returns zero results
**When** the catalog updates
**Then** "Aucun livre ne correspond à votre recherche." is displayed with an "Effacer les filtres" button — the filter chips remain visible showing what the user selected

**Given** the filter bar
**When** rendered
**Then** it has `role="search"`, the text input has `aria-label="Rechercher dans le catalogue"`, and all chips have `aria-pressed` reflecting their active state

---

## Epic 4: Admin Authentication

The library animator can securely log in to the admin interface with dedicated credentials and log out — with no SSO dependency and full security enforcement.

### Story 4.1: Admin Login & Logout API

As the library admin system,
I want a login endpoint that validates credentials and issues a JWT, and a logout endpoint,
So that authenticated admins can access protected resources and securely end their session.

**Acceptance Criteria:**

**Given** `POST /api/auth/login` is called with valid `username` and `password`
**When** the backend validates against the `AdminUsers` table using BCrypt comparison
**Then** HTTP 200 is returned with a `TokenResponse` containing a signed JWT valid for 8 hours
**And** the JWT payload includes the admin username as a claim

**Given** `POST /api/auth/login` is called with invalid credentials
**When** the backend processes the request
**Then** HTTP 401 with a ProblemDetails body is returned — no detail revealing whether username or password was wrong

**Given** `POST /api/auth/logout` is called with a valid JWT in the `Authorization` header
**When** the backend processes the request
**Then** HTTP 200 is returned (stateless logout — client deletes the token)

**Given** any admin API endpoint decorated with `[Authorize]`
**When** called without a JWT or with an expired JWT
**Then** HTTP 401 is returned — never a redirect to a login page

**Given** multiple admin accounts exist in `AdminUsers`
**When** each logs in with their own credentials
**Then** each receives a valid JWT

### Story 4.2: Angular Auth Service, HTTP Interceptor & Route Guard

As a developer,
I want Angular's auth infrastructure — service, interceptor, and route guard — in place,
So that all admin routes are protected and JWT tokens are automatically attached to API requests.

**Acceptance Criteria:**

**Given** an admin successfully logs in via `AuthService.login()`
**When** the JWT is returned from the API
**Then** it is stored in `localStorage` and `AuthService.isAuthenticated()` returns `true`

**Given** `AuthService.logout()` is called
**When** it executes
**Then** the token is removed from `localStorage` and `isAuthenticated()` returns `false`

**Given** a user navigates to any `/admin/*` route (except `/admin/login`)
**When** `AuthGuard` evaluates the route
**Then** an unauthenticated user is redirected to `/admin/login`
**And** an authenticated user proceeds to the requested route

**Given** any HTTP request is made while authenticated
**When** `auth.interceptor.ts` processes the request
**Then** the `Authorization: Bearer <token>` header is automatically attached

**Given** a JWT stored in `localStorage` has expired
**When** `AuthGuard` evaluates the route
**Then** the user is redirected to `/admin/login`

### Story 4.3: Admin Login Page & Admin App Shell

As the library animator,
I want a login page to enter my credentials and an admin interface with a dark app bar and logout button,
So that I can access and exit the admin interface quickly from my smartphone.

**Acceptance Criteria:**

**Given** a user navigates to `/admin/login`
**When** the page renders
**Then** a single-column login form is shown with username and password fields and a full-width "Se connecter" primary button
**And** the public app bar is NOT shown — the login page has its own minimal header

**Given** the admin submits valid credentials
**When** `AuthService.login()` returns a JWT
**Then** the user is redirected to `/admin`

**Given** the admin submits invalid credentials
**When** the API returns 401
**Then** an inline error message is shown below the form — no page reload, no modal

**Given** the admin is on any `/admin/*` page
**When** the page renders
**Then** the admin app bar is dark (`#1A1A1A`), shows the current page title centered, and shows a logout icon button on the right

**Given** the admin taps the logout icon button
**When** `AuthService.logout()` is called
**Then** the token is cleared and the user is redirected to `/`

**Given** a public user loads the homepage
**When** network requests are inspected
**Then** the admin bundle is not loaded (lazy-loaded, separate chunk)

---

## Epic 5: Book Management — Admin CRUD

The animator can add, edit, and delete books from a smartphone, write curator notes, and manage the "Sélection du mois" flag — with immediate confirmation and no friction.

### Story 5.1: Book CRUD API — Create, Update, Delete Endpoints

As the library admin system,
I want authenticated API endpoints to create, update, and delete books,
So that the admin frontend can perform full book management.

**Acceptance Criteria:**

**Given** an authenticated admin calls `POST /api/books` with a valid `CreateBookRequest`
**When** the backend processes the request
**Then** HTTP 201 is returned with the created `BookDto` and a `Location` header pointing to `/api/books/{id}`
**And** `DateAdded` is automatically set to the current UTC datetime
**And** `Status` defaults to `"available"` if not provided

**Given** the `CoverImageUrl` field is provided in a `CreateBookRequest`
**When** the backend processes the request
**Then** an HTTP HEAD check is performed on the URL before storage
**And** if the URL returns a non-2xx response, `CoverImageUrl` is stored as `null` rather than the broken URL

**Given** an authenticated admin calls `PUT /api/books/{id}` with an `UpdateBookRequest`
**When** the book exists
**Then** HTTP 200 is returned with the updated `BookDto`

**Given** `PUT /api/books/{id}` is called for a non-existent id
**When** the backend processes the request
**Then** HTTP 404 with a ProblemDetails body is returned

**Given** an authenticated admin calls `DELETE /api/books/{id}`
**When** the book exists
**Then** HTTP 204 (no body) is returned and the book is removed from the database

**Given** any of these endpoints is called without a valid JWT
**When** the request is processed
**Then** HTTP 401 is returned

### Story 5.2: Admin Book List View

As the library animator,
I want to see all books in the admin interface with edit and delete actions,
So that I can manage the full catalog from my smartphone.

**Acceptance Criteria:**

**Given** the admin navigates to `/admin`
**When** the book list loads
**Then** all books are displayed using the `compact` variant of `BookListItemComponent` (cover + title + author, no curator note preview)
**And** each item shows an edit icon button (✏️) and a delete icon button (🗑️)

**Given** the admin taps the edit icon on a book
**When** it is activated
**Then** the admin is navigated to `/admin/livres/:id/modifier`

**Given** the catalog has no books
**When** the admin book list renders
**Then** "La médiathèque est vide pour l'instant." is shown with an "Ajouter un livre" button

**Given** the admin book list view
**When** it renders
**Then** a fixed FAB (`mat-fab` extended, "Ajouter un livre") is visible at bottom-right (`position: fixed`)
**And** tapping it navigates to `/admin/livres/nouveau`

**Given** `mat-icon-button` actions have no visible text label
**When** rendered
**Then** each has an `aria-label` ("Modifier [titre]", "Supprimer [titre]")

### Story 5.3: Add & Edit Book Form

As the library animator,
I want a form to add a new book or edit an existing one with all fields — including curator note and Sélection du mois toggle — and immediate save confirmation,
So that I can maintain the catalog accurately from my smartphone.

**Acceptance Criteria:**

**Given** the admin navigates to `/admin/livres/nouveau`
**When** the form renders
**Then** all fields appear in this order: ISBN (text input), Titre, Auteur(s), Genre/Catégorie, Année de publication, Couverture (URL), Note du curateur, Sélection du mois (`mat-slide-toggle`)
**And** all fields are single-column, full-width on mobile

**Given** the admin navigates to `/admin/livres/:id/modifier`
**When** the form renders
**Then** all fields are pre-filled with the existing book data and fully editable

**Given** the admin fills in the form and taps "Enregistrer"
**When** the save succeeds (POST 201 or PUT 200)
**Then** a `mat-snack-bar` confirmation appears ("Livre ajouté ✓" or "Livre mis à jour ✓") and auto-dismisses after 3 seconds
**And** the admin is navigated back to `/admin`
**And** focus returns to the FAB "Ajouter un livre" button

**Given** the admin toggles "Sélection du mois" ON for a book and saves
**When** the public homepage loads
**Then** that book appears in the `SelectionDuMoisCardComponent`

**Given** the admin toggles "Sélection du mois" OFF for a previously featured book and saves
**When** the public homepage loads
**Then** that book no longer appears in the `SelectionDuMoisCardComponent`

**Given** the form is in add mode
**When** rendered
**Then** the ISBN field is a plain text input (pre-wired for barcode scan integration in Epic 6)

### Story 5.4: Delete Book with Confirmation Dialog

As the library animator,
I want a confirmation dialog before a book is permanently deleted,
So that I never accidentally remove a book from the catalog with a misplaced tap.

**Acceptance Criteria:**

**Given** the admin taps the delete icon on a book
**When** the action is triggered
**Then** a `mat-dialog` opens with title "Supprimer ce livre ?", the book's title in quotes in the body, and two buttons: "Annuler" (secondary, focused by default) and "Supprimer" (destructive red `#B00020`)

**Given** the admin taps "Annuler" or presses Escape
**When** the dialog closes
**Then** no deletion occurs and focus returns to the delete icon button that triggered the dialog

**Given** the admin taps "Supprimer"
**When** `DELETE /api/books/{id}` returns 204
**Then** the book is removed from the list without a page reload
**And** a `mat-snack-bar` "Livre supprimé" appears and auto-dismisses after 3 seconds

**Given** the admin taps "Supprimer" and the API returns an error
**When** the error is handled
**Then** the dialog closes, the book remains in the list, and an inline error message is shown

---

## Epic 6: ISBN Scan & Metadata Auto-Fill

The animator can scan a book's barcode with a smartphone camera and have metadata auto-filled from Open Library (or Google Books as fallback) — completing the full add-book flow in under 60 seconds, with graceful degradation if any API fails.

### Story 6.1: Backend ISBN Lookup Service — Open Library & Google Books Fallback Chain

As the library admin system,
I want a backend service that looks up ISBN metadata from Open Library and falls back to Google Books,
So that the admin form can be auto-filled without exposing API keys to the browser and without blocking manual entry if both APIs fail.

**Acceptance Criteria:**

**Given** an authenticated admin calls `GET /api/isbn/{isbn}`
**When** Open Library returns full metadata within 5 seconds
**Then** HTTP 200 is returned with a partial `BookDto` containing title, author, genre, publicationYear, and coverImageUrl

**Given** Open Library returns no data or times out after 5 seconds
**When** the fallback chain runs
**Then** Google Books is called (5-second timeout) and its data is returned instead

**Given** both Open Library and Google Books return no data or time out
**When** the fallback chain completes
**Then** HTTP 200 is returned with a `BookDto` where all fields are `null` except `isbn` — never an error response

**Given** the Google Books API key
**When** `IsbnService` initializes
**Then** the key is read from `IConfiguration` (environment variable `GOOGLE_BOOKS_API_KEY`) — never hardcoded in source

**Given** the returned `coverImageUrl` from either API
**When** `IsbnService` processes the response
**Then** an HTTP HEAD check validates the URL before including it in the response
**And** if the cover URL is broken, `coverImageUrl` is returned as `null`

**Given** `GET /api/isbn/{isbn}` is called without a valid JWT
**When** the backend processes the request
**Then** HTTP 401 is returned

### Story 6.2: IsbnScanOverlayComponent — Browser Barcode Scanner

As the library animator,
I want to scan a book's ISBN barcode using my smartphone camera in the browser,
So that I don't have to type a 13-digit number manually.

**Acceptance Criteria:**

**Given** the admin taps the "Scanner" button in the book form
**When** `IsbnScanOverlayComponent` opens
**Then** the overlay is full-screen (`position: fixed; inset: 0`) with an animated scan line and terracotta viewfinder corners
**And** `getUserMedia` is requested only at this point — never on page load

**Given** the device has a camera and the admin grants permission
**When** a barcode is detected by `BarcodeDetector` Web API
**Then** the overlay shows a green success flash with ✓ and the detected ISBN for 1 second, triggers device vibration if available, then closes automatically
**And** the detected ISBN string is emitted to the parent component

**Given** `BarcodeDetector` is not available (Safari iOS)
**When** the component initializes
**Then** ZXing-js is used as the fallback scanner — same UX, transparent to the user

**Given** the device has no camera or the admin denies camera permission
**When** the overlay attempts `getUserMedia`
**Then** an informative message is shown and the overlay automatically switches to the manual ISBN input — no dead end

**Given** 30 seconds elapse without a successful scan
**When** the timeout triggers
**Then** a discreet suggestion appears: "Difficultés ? Saisissez l'ISBN manuellement"

**Given** the "Saisir l'ISBN manuellement" secondary button
**When** tapped at any time
**Then** the overlay closes and the ISBN text field in the book form receives focus — no navigation away

**Given** scan feedback events occur
**When** rendered
**Then** they are announced via `aria-live="polite"`

### Story 6.3: ISBN Auto-Fill Integration in the Admin Book Form

As the library animator,
I want the book form to auto-fill all metadata fields when an ISBN is scanned or entered manually,
So that I can add a new book in under 60 seconds with minimal typing.

**Acceptance Criteria:**

**Given** the admin scans a barcode successfully
**When** the ISBN is emitted to `BookFormComponent`
**Then** `isbn.service.ts` calls `GET /api/isbn/{isbn}` and shows a `mat-progress-spinner` inline during the request

**Given** the API returns metadata (full or partial)
**When** the form is populated
**Then** all returned fields are auto-filled into their respective form controls
**And** each auto-filled field is highlighted with a `#F4E4DC` background for 2 seconds then normalizes
**And** all fields remain fully editable after auto-fill
**And** focus moves automatically to the "Note du curateur" field after auto-fill completes

**Given** the API returns no data (all fields null)
**When** the form handles the empty response
**Then** only the ISBN field is populated; all other fields are empty and editable — no error shown

**Given** the admin enters an ISBN manually in the text field and taps "Rechercher"
**When** the lookup runs
**Then** the same auto-fill flow triggers — identical behavior to the scan path

**Given** Open Library or Google Books is unavailable during lookup
**When** the request completes (empty DTO returned from backend)
**Then** a discreet banner appears: "Impossible de récupérer les métadonnées. Saisissez les informations manuellement."
**And** the form remains fully submittable

**Given** the complete flow: scan barcode → auto-fill → write curator note → tap "Enregistrer"
**When** measured on a standard smartphone under normal network conditions
**Then** the sequence completes in under 60 seconds

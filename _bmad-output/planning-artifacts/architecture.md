---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-04-12'
inputDocuments:
  - "_bmad-output/planning-artifacts/prd.md"
  - "_bmad-output/planning-artifacts/ux-design-specification.md"
  - "_bmad-output/planning-artifacts/product-brief-portail-mediatheque-conviale-distillate.md"
workflowType: 'architecture'
project_name: 'portail-mediatheque-conviale'
user_name: 'Sezratty'
date: '2026-04-12'
---

# Architecture Decision Document — Portail Médiathèque Conviviale

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

35 FRs across 6 categories:

| Category | FRs | Architectural implication |
|---|---|---|
| Catalog Discovery | FR1–FR9 | Unauthenticated read endpoints; filter/search API |
| Book Detail | FR10–FR12 | Single book GET endpoint; curator note field |
| Homepage Editorial | FR13–FR15 | `date_added DESC` query; `is_selection_du_mois` flag |
| Admin Authentication | FR16–FR19 | JWT-based auth; RBAC; multiple admin accounts |
| Book Management | FR20–FR26 | Full CRUD; `status` field pre-included |
| ISBN Scan & Auto-fill | FR27–FR33 | Browser camera integration; Open Library + Google Books chain; graceful degradation |

**Non-Functional Requirements:**

16 NFRs driving concrete architectural decisions:

| NFR | Architectural decision required |
|---|---|
| NFR1: <3s interactive on 4G | Static Angular build served via CDN or nginx; no SSR needed |
| NFR3: No image proxy | Cover URLs stored and served from Open Library CDN directly |
| NFR5: HTTPS only | Reverse proxy (nginx/Caddy) terminates TLS in Docker stack |
| NFR6: bcrypt passwords | ASP.NET Identity password hasher or manual BCrypt.Net |
| NFR7: JWT 8h expiry | JWT config in .NET; Angular interceptor checks expiry |
| NFR8: 401 for unauth | `[Authorize]` attribute + global auth middleware in .NET |
| NFR9: No stack traces in prod | Global exception handler middleware; `ASPNETCORE_ENVIRONMENT=Production` |
| NFR10–11: API unavailability non-blocking | Timeout + try/catch per API call; form remains submittable |
| NFR12: API key as env var | `IConfiguration` in .NET reading from environment; Docker Compose env section |
| NFR13: Cover URL validation | HTTP HEAD check before storage; component-level fallback at render |
| NFR15: Daily SQLite backup | Cron job or Docker sidecar copying `.db` file |
| NFR16: Docker restart policy | `restart: unless-stopped` in Docker Compose |

**Scale & Complexity:**

- Primary domain: Full-stack web application (Angular SPA + .NET REST API)
- Complexity level: **Low** — ~60 books, read-heavy, effectively single writer
- Estimated architectural components: ~8 API controllers, ~12 Angular components, 1 SQLite database
- Concurrency: N concurrent readers (employees), 1 writer (admin) — no locking or caching required

### Technical Constraints & Dependencies

**Non-negotiable stack (decided, not up for discussion):**
- Frontend: Angular SPA (standalone components, no NgModules)
- Backend: .NET REST API
- Database: SQLite, with data access layer abstracted for future PostgreSQL migration
- Hosting: Sovereign French cloud — OVH VPS Starter or Scaleway DEV1-S
- Deployment: Docker / Docker Compose
- Auth: Dedicated credentials, JWT — no SSO, no Azure AD

**External dependencies:**
- Open Library API — free, no key, primary ISBN metadata source
- Google Books API — free tier, API key required, fallback only
- Open Library Covers CDN — direct URL embed, no proxy

**Browser constraints:**
- Evergreen browsers only (last 2 major versions)
- `BarcodeDetector` Web API (Chromium 2024+) as primary scanner; ZXing-js as fallback for Safari iOS
- No IE11, no legacy Edge

### Cross-Cutting Concerns Identified

1. **JWT Authentication** — Angular route guards on `/admin/*`; HTTP interceptor attaches `Authorization: Bearer` header; .NET `[Authorize]` + global middleware enforces 401
2. **External API resilience** — Timeout (5s) + fallback chain: Open Library → Google Books → manual entry; neither API failure blocks form submission
3. **Error handling** — .NET global exception handler (no stack traces in production); Angular HTTP error interceptor surfaces user-friendly messages
4. **Cover URL validation** — HTTP HEAD check before storage (NFR13); `BookCoverComponent` handles broken URLs gracefully at render time with warm placeholder
5. **Environment configuration** — Google Books API key, JWT secret, CORS origins — all via environment variables; never hardcoded; Docker Compose `.env` file pattern
6. **Scroll restoration** — Angular Router `scrollPositionRestoration: 'enabled'` for back-navigation UX requirement

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web application — Angular SPA + ASP.NET Core Web API. Two separately scaffolded projects composed in a single repository via Docker Compose.

### Starter Options Considered

| Option | Assessment |
|---|---|
| `dotnet new angular` (Microsoft combined template) | Discontinued since .NET 8 — not available in .NET 10 SDK |
| Community `angular-spa` (NetCoreTemplates) | Targets .NET 10 + Angular + Vite + Tailwind — misaligned (Tailwind instead of Angular Material) |
| Separate scaffold: `ng new` + `dotnet new webapi` | **Selected** — current best practice, each side at latest version, full control |

### Selected Approach: Separate Scaffolding

**Rationale:** The combined template is discontinued and community alternatives don't match the confirmed stack (Angular Material M3). Separate scaffolding at current versions gives clean, up-to-date projects with full control over configuration.

**Frontend initialization command:**

```bash
ng new portail-mediatheque-frontend --routing --style=scss
```

*`--standalone` defaults to `true` in Angular 17+. SSR not enabled by default.*

**Backend initialization command:**

```bash
dotnet new webapi -n PortailMediatheque.Api --no-https --use-controllers
```

*`--no-https`: HTTPS handled by nginx reverse proxy. `--use-controllers`: controller-based API fits a multi-resource REST design better than minimal API at this scope. `--auth None` is the default.*

**Monorepo structure:**
```
portail-mediatheque-conviale/
  frontend/          ← ng new output
  backend/           ← dotnet new webapi output
  docker-compose.yml
  .env.example
```

### Architectural Decisions Provided by Scaffolding

**Language & Runtime:**
- Frontend: TypeScript 5.x (Angular 21 default), strict mode enabled
- Backend: C# 13 on .NET 10 LTS (supported until November 2028)

**Styling Solution:**
- SCSS (scaffolded) + Angular Material M3 added post-init via `ng add @angular/material`

**Build Tooling:**
- Frontend: Angular CLI (esbuild) — `ng build` produces static output served by nginx
- Backend: `dotnet publish` produces binary for Docker image

**Testing Framework:**
- Frontend: Jasmine + Karma (Angular default)
- Backend: xUnit (added post-init)

**Code Organization:**
- Frontend: Angular CLI default, extended with `shared/components/`, `features/catalog/`, `features/admin/`
- Backend: Controller-based — `Controllers/`, `Models/`, `Services/`, `Data/`

**Development Experience:**
- Frontend: `ng serve` with HMR on `localhost:4200`
- Backend: `dotnet watch run` on `localhost:5000` (HTTP in dev)
- CORS: .NET configured to allow `http://localhost:4200` in development

**Note:** Project initialization using these commands is the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (block implementation):**
- ORM and data access pattern — EF Core with SQLite
- JWT implementation and token storage — `JwtBearer` middleware + `localStorage`
- Admin credential bootstrap — seeded from environment on first startup
- Frontend HTTP layer — dedicated service classes
- Frontend forms — Reactive Forms throughout admin

**Important Decisions (shape architecture):**
- Password hashing library — `BCrypt.Net-Next`
- API response format — plain objects + ProblemDetails for errors
- Docker Compose structure — single prod file + override for dev
- Reverse proxy — nginx

**Deferred to Post-MVP:**
- CI/CD pipeline — manual deployment for MVP
- API versioning — not needed until a second consumer exists
- Rate limiting — internal tool, captive audience

### Data Architecture

| Decision | Choice | Rationale |
|---|---|---|
| ORM | EF Core 10 with SQLite provider | Migrations, LINQ, provider-swappable to PostgreSQL |
| Data access pattern | `BookService` / `AuthService` wrapping `AppDbContext` directly | Repository pattern adds indirection with no benefit at this scale |
| Migrations | Auto-applied at startup via `context.Database.Migrate()` | Single admin, no zero-downtime constraint |
| Validation | Data Annotations on model classes | Sufficient for field count, no extra dependency |
| Caching | None — 60 books, read-heavy, SQLite fast enough | Add if needed post-launch |

**Package:** `dotnet add package Microsoft.EntityFrameworkCore.Sqlite`

### Authentication & Security

| Decision | Choice | Rationale |
|---|---|---|
| JWT library | `Microsoft.AspNetCore.Authentication.JwtBearer` (built-in) | No extra dependency |
| Password hashing | `BCrypt.Net-Next` | Explicit bcrypt, no full Identity stack dependency |
| Token storage (Angular) | `localStorage` + HTTP interceptor | Admin is a trusted named individual; cookie-based auth complexity unwarranted |
| JWT expiry | 8 hours (per NFR7) | No refresh token for MVP |
| Admin bootstrap | Hashed credentials seeded from environment variables on first startup | Reproducible, no first-run endpoint needed |

**Package:** `dotnet add package BCrypt.Net-Next`

### API & Communication Patterns

| Decision | Choice | Rationale |
|---|---|---|
| API versioning | None for MVP | Single consumer (our Angular SPA), no versioning friction needed |
| OpenAPI/Swagger | Enabled in development, disabled in production | Useful for debugging; not a security risk but not needed in prod |
| Response format | Plain objects for success; `ProblemDetails` (RFC 7807) for errors | .NET default, no custom middleware required |
| CORS | Environment-variable-driven allowed origins | `http://localhost:4200` in dev, production domain in prod |
| Error handling | Global exception middleware → ProblemDetails; no stack traces in production | Satisfies NFR9 |

### Frontend Architecture

| Decision | Choice | Rationale |
|---|---|---|
| State management | Component-level only — no NgRx | Confirmed in PRD; overkill for 60 books |
| HTTP layer | Dedicated service classes (`BookService`, `AuthService`, `IsbnService`) | Testable, reusable, Angular best practice |
| Admin forms | Reactive Forms (`FormBuilder` / `FormGroup`) | Programmatic auto-fill, async validators, state inspection |
| Route lazy loading | Admin (`/admin/*`) lazy-loaded; public routes eager | Admin bundle never loaded by public users |
| Environment config | `environment.ts` (build-time) | Only one env-sensitive value (API base URL); runtime config is overkill |
| Angular Material | Added post-init via `ng add @angular/material` | M3 theming, warm editorial palette configured at setup |

### Infrastructure & Deployment

| Decision | Choice | Rationale |
|---|---|---|
| Reverse proxy | nginx | Stable, well-documented, explicit config, standard on OVH/Scaleway |
| Docker Compose | Single `docker-compose.yml` (prod) + `docker-compose.override.yml` (dev) | Standard Compose pattern; prod file is source of truth |
| SQLite persistence | Named Docker volume mounted at `/data/mediatheque.db` | Persists across container restarts and image upgrades |
| Backup | Host cron job copying volume file daily to timestamped path | Simple, no extra tooling |
| CI/CD | None for MVP — `git pull` + `docker compose up -d --build` on VPS | Solo project, spare time; add GitHub Actions when manual deploy becomes friction |
| TLS | nginx handles Let's Encrypt / OVH certificate termination | .NET app runs HTTP-only inside Docker network |

### Decision Impact Analysis

**Implementation Sequence:**
1. Scaffold frontend (`ng new`) + backend (`dotnet new webapi`) + configure monorepo structure
2. Set up EF Core + SQLite, define `Book` and `Admin` entities, run initial migration
3. Implement JWT auth endpoints + Angular `AuthService` + HTTP interceptor + route guards
4. Implement public catalog API (GET /books, GET /books/:id, filtering) + Angular catalog components
5. Implement admin CRUD API + Angular admin forms with Reactive Forms
6. Implement ISBN scan + Open Library / Google Books service chain
7. Wire Docker Compose + nginx reverse proxy for deployment

**Cross-Component Dependencies:**
- `BookCoverComponent` must be built before `BookListItemComponent` and `SelectionDuMoisCardComponent`
- Angular HTTP interceptor (JWT) must be in place before any admin API call is made
- EF Core migrations must be stable before admin CRUD implementation begins
- `IsbnService` (external API chain) is independent — can be built in parallel with catalog

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Database / EF Core naming:**

| Element | Convention | Example |
|---|---|---|
| Entity class | PascalCase singular | `Book`, `AdminUser` |
| Table name | EF default (matches class name) | `Books`, `AdminUsers` |
| Column name | EF default (matches property name) PascalCase | `CuratorNote`, `DateAdded` |
| Primary key | `Id` (EF convention auto-detects) | `public int Id { get; set; }` |
| Foreign key | `{Entity}Id` | `BookId` |
| Migration name | PascalCase verb + subject | `AddBookTable`, `AddIsSelectionFlag` |

**API endpoint naming:**

| Convention | Rule | Example |
|---|---|---|
| Resource naming | Plural nouns | `/api/books`, `/api/auth` |
| Route parameters | camelCase | `/api/books/{id}` |
| Query parameters | camelCase | `?genre=fiction&year=2023` |
| HTTP verbs | Standard REST | GET (read), POST (create), PUT (full update), DELETE |

**C# naming (backend):**

| Element | Convention | Example |
|---|---|---|
| Class | PascalCase | `BookService`, `BooksController` |
| Interface | `I` prefix | `IBookService` |
| Public method | PascalCase + `Async` suffix | `GetAllAsync()`, `CreateBookAsync()` |
| Private field | camelCase with `_` prefix | `_context`, `_configuration` |
| DTO class | PascalCase + `Dto`/`Request`/`Response` suffix | `BookDto`, `CreateBookRequest` |

**Angular / TypeScript naming:**

| Element | Convention | Example |
|---|---|---|
| Component class | PascalCase + `Component` | `BookListItemComponent` |
| Component file | kebab-case | `book-list-item.component.ts` |
| Service class | PascalCase + `Service` | `BookService` |
| Interface/type | PascalCase | `Book`, `AdminCredentials` |
| Variable/property | camelCase | `isLoading`, `selectedBook` |
| Observable property | camelCase + `$` suffix | `books$` |
| Route paths | kebab-case | `/admin/livres/nouveau` |

### Structure Patterns

**Backend file organization:**
```
backend/
  Controllers/
    BooksController.cs
    AuthController.cs
  Models/
    Book.cs
    AdminUser.cs
    DTOs/
      BookDto.cs
      CreateBookRequest.cs
      UpdateBookRequest.cs
  Services/
    BookService.cs
    AuthService.cs
    IsbnService.cs
    Interfaces/
      IBookService.cs
      IAuthService.cs
  Data/
    AppDbContext.cs
    Migrations/             ← EF Core generated, never hand-edited
  Middleware/
    ExceptionHandlingMiddleware.cs
```

**Frontend file organization:**
```
frontend/src/app/
  features/
    catalog/
      catalog.component.ts
      catalog.routes.ts
      book-detail/
        book-detail.component.ts
    admin/                  ← lazy-loaded
      admin.routes.ts
      book-list/
      book-form/
      login/
  shared/
    components/
      book-list-item/
      book-cover/
      selection-du-mois-card/
      isbn-scan-overlay/
      filter-bar/
    services/
      book.service.ts
      auth.service.ts
      isbn.service.ts
    models/
      book.model.ts
      auth.model.ts
    interceptors/
      auth.interceptor.ts
    guards/
      auth.guard.ts
```

**Tests location:**
- Backend: `backend.Tests/` — separate xUnit project in solution
- Frontend: colocated `*.spec.ts` files (Angular default)

### Format Patterns

**JSON / API data exchange:**

| Rule | Convention |
|---|---|
| JSON field names | camelCase (ASP.NET Core System.Text.Json default — do not override) |
| Date/time fields | ISO 8601 string: `"2026-04-12T00:00:00Z"` — never timestamps |
| Boolean fields | `true` / `false` — never `1` / `0` |
| Nullable fields | Included in response as `null` — never omitted |
| Empty arrays | `[]` — never `null` for collections |

**Success response (plain object):**
```json
{
  "id": 1,
  "title": "An Elegant Puzzle",
  "author": "Will Larson",
  "genre": "Management",
  "publicationYear": 2019,
  "coverImageUrl": "https://covers.openlibrary.org/b/isbn/...",
  "curatorNote": "Incontournable pour les tech leads.",
  "dateAdded": "2026-04-01T00:00:00Z",
  "isSelectionDuMois": true,
  "status": "available"
}
```

**Error response (ProblemDetails — RFC 7807):**
```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Validation failed",
  "status": 400,
  "detail": "The ISBN field is required."
}
```

**HTTP status codes:**

| Situation | Status |
|---|---|
| GET success | 200 |
| POST success (created) | 201 + `Location` header |
| PUT/PATCH success | 200 |
| DELETE success | 204 (no body) |
| Not found | 404 |
| Validation error | 400 |
| Unauthenticated | 401 |
| Forbidden | 403 |
| Server error | 500 (middleware, no stack trace) |

### Process Patterns

**Angular loading state pattern:**
```typescript
isLoading = false;

loadBooks(): void {
  this.isLoading = true;
  this.bookService.getAll().subscribe({
    next: (books) => { this.books = books; this.isLoading = false; },
    error: () => { this.isLoading = false; /* show inline error */ }
  });
}
```

**Backend async pattern:**
```csharp
// All service methods async, return Task<T>
// All controller actions async, return ActionResult<T>
// Never use .Result or .Wait()
public async Task<ActionResult<BookDto>> GetById(int id)
{
    var book = await _bookService.GetByIdAsync(id);
    if (book is null) return NotFound();
    return Ok(book);
}
```

**ISBN service fallback chain:**
```csharp
// 1. Try Open Library (5s timeout)
// 2. On null/empty/timeout → try Google Books (5s timeout)
// 3. On null/empty/timeout → return empty DTO (all fields null)
// NEVER throw on API failure — always return partial/empty data
```

### Enforcement Guidelines

**All implementation agents MUST:**
- Use camelCase for JSON fields in both .NET serialization and Angular models
- Return `ProblemDetails` for all API errors — never custom error objects
- Suffix all async backend methods with `Async`
- Never hardcode the API base URL — always use `environment.apiUrl`
- Never store secrets (JWT secret, Google Books API key) in source code
- Apply `[Authorize]` to all admin controllers — never rely on Angular route guards alone for API security
- Inject service classes in controllers, not `DbContext` directly

**Anti-patterns to avoid:**

| Anti-pattern | Correct pattern |
|---|---|
| JWT token manipulation in a component | Encapsulate entirely in `AuthService` |
| `console.log()` left in production code | Remove before commit |
| Calling Open Library API from Angular | Always via .NET `IsbnService` (keeps key server-side) |
| Direct `DbContext` injection in controllers | Controller → Service → DbContext |
| `PascalCase` JSON field names (`"Title"`) | `camelCase` (`"title"`) — System.Text.Json default |

## Project Structure & Boundaries

### Complete Project Directory Structure

```
portail-mediatheque-conviale/            ← git root
├── .env.example                         ← template for secrets (committed)
├── .gitignore
├── docker-compose.yml                   ← production compose
├── docker-compose.override.yml          ← local dev overrides
├── nginx/
│   └── nginx.conf                       ← reverse proxy (TLS, static, proxy_pass)
│
├── frontend/                            ← ng new output
│   ├── angular.json
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── Dockerfile
│   └── src/
│       ├── main.ts
│       ├── index.html
│       ├── styles.scss                  ← Angular Material M3 theme + global styles
│       ├── environments/
│       │   ├── environment.ts           ← { apiUrl: 'http://localhost:5000' }
│       │   └── environment.prod.ts     ← { apiUrl: '/api' }
│       └── app/
│           ├── app.config.ts           ← provideRouter, provideHttpClient, Material theme
│           ├── app.routes.ts           ← public eager, admin lazy
│           │
│           ├── features/
│           │   ├── catalog/            ← FR1–FR15 (public)
│           │   │   ├── catalog.routes.ts
│           │   │   ├── home/
│           │   │   │   └── home.component.ts          ← Sélection du mois + Recently Added + list
│           │   │   └── book-detail/
│           │   │       └── book-detail.component.ts   ← FR10–FR12
│           │   │
│           │   └── admin/              ← FR16–FR35 (lazy-loaded)
│           │       ├── admin.routes.ts
│           │       ├── login/
│           │       │   └── login.component.ts
│           │       ├── book-list/
│           │       │   └── book-list.component.ts
│           │       └── book-form/
│           │           └── book-form.component.ts     ← add + edit (reused)
│           │
│           └── shared/
│               ├── components/
│               │   ├── book-list-item/
│               │   │   └── book-list-item.component.ts
│               │   ├── book-cover/
│               │   │   └── book-cover.component.ts
│               │   ├── selection-du-mois-card/
│               │   │   └── selection-du-mois-card.component.ts
│               │   ├── isbn-scan-overlay/
│               │   │   └── isbn-scan-overlay.component.ts   ← FR27–FR28
│               │   └── filter-bar/
│               │       └── filter-bar.component.ts          ← FR3–FR8
│               ├── services/
│               │   ├── book.service.ts
│               │   ├── auth.service.ts
│               │   └── isbn.service.ts
│               ├── models/
│               │   ├── book.model.ts
│               │   └── auth.model.ts
│               ├── interceptors/
│               │   └── auth.interceptor.ts
│               └── guards/
│                   └── auth.guard.ts
│
├── backend/                             ← dotnet new webapi output
│   ├── PortailMediatheque.Api.csproj
│   ├── appsettings.json
│   ├── appsettings.Development.json     ← CORS allow localhost:4200
│   ├── Dockerfile
│   ├── Program.cs                       ← DI, middleware pipeline, EF migrate on startup
│   │
│   ├── Controllers/
│   │   ├── BooksController.cs           ← FR1–FR15, FR20–FR26
│   │   ├── AuthController.cs            ← FR16–FR19
│   │   └── IsbnController.cs            ← FR27–FR33
│   │
│   ├── Models/
│   │   ├── Book.cs                      ← EF Core entity (FR34–FR35)
│   │   ├── AdminUser.cs
│   │   └── DTOs/
│   │       ├── BookDto.cs
│   │       ├── CreateBookRequest.cs
│   │       ├── UpdateBookRequest.cs
│   │       ├── LoginRequest.cs
│   │       └── TokenResponse.cs
│   │
│   ├── Services/
│   │   ├── BookService.cs
│   │   ├── AuthService.cs
│   │   ├── IsbnService.cs               ← Open Library + Google Books fallback chain
│   │   └── Interfaces/
│   │       ├── IBookService.cs
│   │       ├── IAuthService.cs
│   │       └── IIsbnService.cs
│   │
│   ├── Data/
│   │   ├── AppDbContext.cs
│   │   └── Migrations/                  ← EF Core generated, never hand-edited
│   │
│   └── Middleware/
│       └── ExceptionHandlingMiddleware.cs   ← NFR9: no stack traces in production
│
└── backend.Tests/                       ← dotnet new xunit
    ├── backend.Tests.csproj
    ├── Services/
    │   ├── BookServiceTests.cs
    │   ├── IsbnServiceTests.cs
    │   └── AuthServiceTests.cs
    └── Controllers/
        └── BooksControllerTests.cs
```

### Architectural Boundaries

**API Boundaries:**

| Boundary | Auth required | Notes |
|---|---|---|
| GET `/api/books`, GET `/api/books/{id}` | No | Public catalog (FR1–FR12) |
| POST/PUT/DELETE `/api/books/*` | Yes (`[Authorize]`) | Admin CRUD (FR20–FR26) |
| POST `/api/auth/login` | No | Returns JWT (FR16) |
| POST `/api/auth/logout` | Yes | Stateless — client deletes token (FR19) |
| GET `/api/isbn/{isbn}` | Yes | Admin-only ISBN lookup (FR27–FR33) |

**Data Boundaries:**
- `AppDbContext` accessed only through Service classes — never injected into Controllers
- EF Core Migrations directory is generated — never manually edited
- SQLite file on Docker named volume — never inside the application image layer

**Frontend Routing Boundaries:**

| Route | Bundle | Guard |
|---|---|---|
| `/`, `/livres/:id` | Eagerly loaded | None |
| `/admin/*` | Lazy-loaded (separate chunk) | `AuthGuard` |
| `/admin/login` | Inside admin lazy chunk | None (it is the login page) |

### Requirements to Structure Mapping

| FR group | Frontend | Backend |
|---|---|---|
| FR1–FR9 (Catalog Discovery) | `home.component.ts`, `filter-bar.component.ts`, `book.service.ts` | `BooksController.cs` GET with query params |
| FR10–FR12 (Book Detail) | `book-detail.component.ts`, `book.service.ts` | `BooksController.cs` GET by id |
| FR13–FR15 (Homepage Editorial) | `home.component.ts`, `selection-du-mois-card.component.ts` | `BooksController.cs` (filter isSelectionDuMois, sort dateAdded) |
| FR16–FR19 (Auth) | `login.component.ts`, `auth.service.ts`, `auth.interceptor.ts`, `auth.guard.ts` | `AuthController.cs`, `AuthService.cs` |
| FR20–FR26 (Book Management) | `book-list.component.ts`, `book-form.component.ts`, `book.service.ts` | `BooksController.cs` POST/PUT/DELETE |
| FR27–FR33 (ISBN Scan) | `isbn-scan-overlay.component.ts`, `isbn.service.ts` | `IsbnController.cs`, `IsbnService.cs` |
| FR34–FR35 (Data Model) | `book.model.ts`, `auth.model.ts` | `Book.cs`, `AdminUser.cs`, EF Migrations |

### Integration Points

**Internal data flow:**
```
Angular Component → Angular Service (HttpClient)
  → .NET Controller ([Authorize] if admin)
    → .NET Service → AppDbContext (EF Core) → SQLite (Docker volume)
```

**External integrations:**

| Integration | Direction | Location | Timeout |
|---|---|---|---|
| Open Library API | Backend outbound | `IsbnService.cs` | 5s |
| Google Books API | Backend outbound | `IsbnService.cs` | 5s |
| Open Library Covers CDN | Frontend direct (img src) | `book-cover.component.ts` | N/A |

**ISBN scan to live book — end-to-end flow:**
1. `IsbnScanOverlay` reads barcode → emits ISBN string
2. `BookFormComponent` → `isbn.service.ts` → POST `/api/isbn/{isbn}`
3. `IsbnController` → `IsbnService` → Open Library → (fallback) Google Books → returns partial `BookDto`
4. `BookFormComponent` populates `FormGroup` fields (all remain editable)
5. Admin writes curator note → submits → `book.service.ts` → POST `/api/books`
6. `BooksController` → `BookService` → EF Core INSERT → 201 response
7. Book immediately visible on public catalog

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
- Angular 21 + .NET 10 + EF Core + SQLite — all current, no version conflicts
- `BCrypt.Net-Next` and `JwtBearer` are independent packages, no conflicts
- `BarcodeDetector` / ZXing-js feature detection at runtime — no build-time incompatibility
- nginx reverse proxy + Docker Compose — standard stack, no conflicts

**Pattern Consistency:**
- camelCase JSON: System.Text.Json default (backend) + Angular `HttpClient` default (frontend) — no manual serialization configuration needed ✅
- Reactive Forms aligns with programmatic ISBN auto-fill requirement (FR31) ✅
- `[Authorize]` on controllers + `AuthGuard` on routes — defense-in-depth, no contradiction ✅
- `environment.ts` apiUrl = `http://localhost:5000` in dev, `/api` in prod — nginx proxies `/api/*` → backend container ✅

**Structure Alignment:**
- Lazy-loaded admin module never included in public bundle — structure enforces this ✅
- `IsbnController` is `[Authorize]` — Angular calls it only from admin context ✅
- `BookCoverComponent` in `shared/components/` — correctly reused by both `BookListItemComponent` and `SelectionDuMoisCardComponent` ✅

### Requirements Coverage Validation ✅

**Functional Requirements — all 35 FRs covered:**

| FR range | Covered by |
|---|---|
| FR1–FR9 | `BooksController` GET + query params; `FilterBarComponent` |
| FR10–FR12 | `BooksController` GET by id; `book-detail.component` |
| FR13–FR15 | `BooksController` filter params; `home.component`; `selection-du-mois-card.component` |
| FR16–FR19 | `AuthController`, `AuthService`, JWT middleware, `AuthGuard`, `auth.interceptor` |
| FR20–FR26 | `BooksController` POST/PUT/DELETE; `Book.cs` entity with `Status` field |
| FR27–FR33 | `isbn-scan-overlay.component`, `IsbnController`, `IsbnService` (Open Library → Google Books) |
| FR34–FR35 | `Book.cs` entity; `DateAdded` auto-set in `BookService.CreateAsync` |

**Non-Functional Requirements — all 16 NFRs covered:**

| NFR | Architecture coverage |
|---|---|
| NFR1 (<3s on 4G) | Static Angular build via nginx; lazy admin bundle |
| NFR3 (No image proxy) | `book-cover.component` uses direct `img src` to Open Library CDN |
| NFR5 (HTTPS) | nginx handles TLS termination |
| NFR6 (bcrypt) | `BCrypt.Net-Next` in `AuthService` |
| NFR7 (JWT 8h) | `JwtBearer` configuration in `Program.cs` |
| NFR8 (401 for unauth) | `[Authorize]` + `ExceptionHandlingMiddleware` |
| NFR9 (No stack traces) | `ExceptionHandlingMiddleware.cs` + `ASPNETCORE_ENVIRONMENT=Production` |
| NFR10–11 (API non-blocking) | `IsbnService` try/catch with 5s timeout; form always submittable |
| NFR12 (API key as env var) | `IConfiguration` in `IsbnService`; Docker Compose env section |
| NFR13 (Cover URL validation) | HTTP HEAD check in `BookService.CreateAsync` before storage |
| NFR15 (Daily backup) | Host cron + named Docker volume |
| NFR16 (Docker restart) | `restart: unless-stopped` in `docker-compose.yml` |

### Gap Analysis Results

**No critical gaps. Minor implementation notes (non-blocking):**

1. **Admin seed initialization** — `Program.cs` checks `AdminUsers` table empty → hashes env credentials → inserts. Trivial to implement at project setup.
2. **Cover URL HEAD validation** — acceptable to defer to sprint 2 if launch timeline is tight; `BookCoverComponent` already handles broken URLs at render time.
3. **Scroll restoration** — `scrollPositionRestoration: 'enabled'` in `app.config.ts` router config. One-liner; must not be forgotten.
4. **nginx `/api` prefix handling** — backend routes stay as `/books`, `/auth`; nginx strips `/api` prefix when proxying: `proxy_pass http://backend:5000/` (trailing slash strips prefix). Standard pattern; must be explicit in `nginx.conf`.

### Architecture Completeness Checklist

- [x] Project context analyzed (35 FRs, 16 NFRs, Low complexity)
- [x] Critical decisions documented with versions (.NET 10, Angular 21, EF Core, BCrypt.Net-Next)
- [x] All NFRs architecturally addressed
- [x] Naming conventions established (camelCase JSON, PascalCase C#, kebab Angular)
- [x] Project structure complete — every FR maps to a specific file
- [x] Integration points defined (Open Library → Google Books → manual fallback chain)
- [x] Anti-patterns documented
- [x] Docker + nginx deployment topology specified

### Architecture Readiness Assessment

**Overall Status: READY FOR IMPLEMENTATION**

**Confidence level: High** — low-complexity project, non-negotiable stack, all 35 FRs mapped to specific files, no ambiguous cross-cutting decisions.

**Key strengths:**
- Every FR maps to a specific file — no implementation ambiguity
- Anti-pattern list prevents the most common AI agent divergences
- ISBN fallback chain fully specified — the most technically risky flow has a clear contract
- Docker/nginx topology matches a real OVH/Scaleway deployment

**Post-MVP enhancements:**
- PostgreSQL migration (data layer already abstracted via `AppDbContext`)
- GitHub Actions CI/CD when manual deploy becomes friction
- API versioning when a second consumer exists

### Implementation Handoff

**Project initialization commands (first implementation story):**

```bash
# Frontend
ng new portail-mediatheque-frontend --routing --style=scss
cd portail-mediatheque-frontend && ng add @angular/material

# Backend
dotnet new webapi -n PortailMediatheque.Api --no-https --use-controllers

# Tests
dotnet new xunit -n backend.Tests

# Backend packages
cd backend
dotnet add package Microsoft.EntityFrameworkCore.Sqlite
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet add package BCrypt.Net-Next
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
```

**AI Agent reference:** This document is the single source of truth for all architectural decisions. When in doubt about naming, structure, or patterns — consult this document before inventing a convention.

# Story 1.1: Scaffold Frontend & Backend Projects

Status: ready-for-dev

## Story

As a developer,
I want the monorepo scaffolded with Angular frontend, .NET backend, and test project configured,
So that the team has a clean, runnable baseline with the Angular Material M3 warm editorial theme in place.

## Acceptance Criteria

1. **Given** the repository is cloned, **when** a developer runs `npm install` in `frontend/` and `dotnet restore` in `backend/`, **then** `ng serve` starts on `localhost:4200` and `dotnet run` starts on `localhost:5000` without errors.
2. **Given** the Angular app is running, **when** `ng build` runs, **then** a static output is produced in `frontend/dist/` without errors.
3. **Given** the test project, **when** `dotnet test` runs in `backend.Tests/`, **then** it succeeds (zero tests initially is acceptable).
4. **Given** the Angular app is running, **when** a user opens `localhost:4200`, **then** the public app bar renders "Médiathèque conviviale" with "conviviale" in terracotta (`#B85C38`) and a discreet "Admin" ghost button top-right.
5. **Given** the Angular app is running, **then** page background is warm parchment (`#F8F5F0`), Inter font is loaded, and Angular Material M3 terracotta theme is applied globally.
6. **Given** the backend is running in development, **when** `GET /swagger` is accessed, **then** Swagger UI is rendered.
7. **Given** the backend is running in production (`ASPNETCORE_ENVIRONMENT=Production`), **when** `GET /swagger` is accessed, **then** 404 is returned (Swagger disabled).

## Tasks / Subtasks

- [ ] Task 1: Create monorepo root structure (AC: #1)
  - [ ] Create `.env.example` with placeholder vars: `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `JWT_SECRET`, `GOOGLE_BOOKS_API_KEY`, `CORS_ORIGIN`
  - [ ] Create `nginx/nginx.conf` stub (TLS termination, static serving, `/api` proxy_pass — can be minimal now, completed in Story 1.4)
  - [ ] Create root `.gitignore` covering `node_modules/`, `dist/`, `bin/`, `obj/`, `*.db`, `.env`
  - [ ] Create stub `docker-compose.yml` (full config in Story 1.4)

- [ ] Task 2: Scaffold Angular frontend (AC: #1, #2, #4, #5)
  - [ ] Run `ng new portail-mediatheque-frontend --routing --style=scss` and move output to `frontend/`
  - [ ] Run `ng add @angular/material` — select custom theme, include typography and animations
  - [ ] Install Inter font via `npm install @fontsource/inter` and import in `styles.scss`
  - [ ] Configure M3 warm terracotta custom theme in `styles.scss`:
    - CSS custom properties: `--color-background: #F8F5F0`, `--color-surface: #FFFFFF`, `--color-on-surface: #1A1A1A`, `--color-on-surface-variant: #6B6561`, `--color-primary: #B85C38`, `--color-primary-container: #F4E4DC`, `--color-outline: #E8E3DD`, `--color-error: #BA1A1A`, `--color-success: #386A20`
    - Body large: 16px, weight 400, line-height 1.6 (for curator notes)
    - Apply `background-color: var(--color-background)` to `body`
  - [ ] Create `frontend/src/environments/environment.ts` with `{ apiUrl: 'http://localhost:5000' }`
  - [ ] Create `frontend/src/environments/environment.prod.ts` with `{ apiUrl: '/api' }`
  - [ ] Configure `angular.json` `fileReplacements` to swap environments on `ng build --configuration production`
  - [ ] Set up `app.config.ts` with `provideRouter(routes, withComponentInputBinding(), withScrollRestoration())` — `scrollPositionRestoration: 'enabled'` is MANDATORY (UX-DR13), also `provideHttpClient(withInterceptorsFromDi())`, `provideAnimations()`
  - [ ] Configure `app.routes.ts`: public routes eager-loaded (catalog feature), admin routes lazy-loaded (`loadChildren(() => import('./features/admin/admin.routes'))`)
  - [ ] Create folder structure (empty placeholder files acceptable for now):
    - `features/catalog/catalog.routes.ts`, `features/catalog/home/home.component.ts`
    - `features/catalog/book-detail/book-detail.component.ts`
    - `features/admin/admin.routes.ts`, `features/admin/login/login.component.ts`
    - `features/admin/book-list/book-list.component.ts`, `features/admin/book-form/book-form.component.ts`
    - `shared/components/book-cover/book-cover.component.ts`
    - `shared/components/book-list-item/book-list-item.component.ts`
    - `shared/components/selection-du-mois-card/selection-du-mois-card.component.ts`
    - `shared/components/isbn-scan-overlay/isbn-scan-overlay.component.ts`
    - `shared/components/filter-bar/filter-bar.component.ts`
    - `shared/services/book.service.ts`, `shared/services/auth.service.ts`, `shared/services/isbn.service.ts`
    - `shared/models/book.model.ts`, `shared/models/auth.model.ts`
    - `shared/interceptors/auth.interceptor.ts`
    - `shared/guards/auth.guard.ts`
  - [ ] Implement `AppComponent` with public app bar: "Médiathèque conviviale" wordmark with "conviviale" styled in `color: #B85C38`, and a `mat-button` "Admin" ghost button in top-right that routes to `/admin` (AC: #4)
  - [ ] Add a `<router-outlet>` to `AppComponent` template
  - [ ] Verify `ng serve` runs on `localhost:4200` without errors (AC: #1)
  - [ ] Verify `ng build` produces output (AC: #2)

- [ ] Task 3: Scaffold .NET backend (AC: #1, #6, #7)
  - [ ] Run `dotnet new webapi -n PortailMediatheque.Api --no-https --use-controllers` — output to `backend/`
  - [ ] Add NuGet packages:
    - `dotnet add package Microsoft.EntityFrameworkCore.Sqlite`
    - `dotnet add package Microsoft.EntityFrameworkCore.Design`
    - `dotnet add package BCrypt.Net-Next`
    - `dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer`
  - [ ] Create folder structure (empty files acceptable): `Controllers/`, `Models/DTOs/`, `Services/Interfaces/`, `Data/Migrations/`, `Middleware/`
  - [ ] Configure `Program.cs`:
    - CORS: allow `http://localhost:4200` in development (read allowed origins from `IConfiguration`/env var for production)
    - Swagger: enabled only when `app.Environment.IsDevelopment()` — disabled/returns 404 in production (AC: #6, #7)
    - Placeholder DI registrations (BookService, AuthService as stubs — full implementation in Stories 1.2, 4.1)
    - `app.UseRouting()`, `app.UseCors()`, `app.UseAuthentication()`, `app.UseAuthorization()`, `app.MapControllers()`
  - [ ] Configure `appsettings.Development.json` with `"Cors": { "AllowedOrigins": ["http://localhost:4200"] }`
  - [ ] Verify `dotnet run` starts on `localhost:5000` without errors (AC: #1)

- [ ] Task 4: Scaffold test project (AC: #3)
  - [ ] Run `dotnet new xunit -n backend.Tests` — output to `backend.Tests/`
  - [ ] Create `.sln` and add both projects: `dotnet new sln -n PortailMediatheque`, `dotnet sln add backend/PortailMediatheque.Api.csproj`, `dotnet sln add backend.Tests/backend.Tests.csproj`
  - [ ] Add project reference: `dotnet add backend.Tests/backend.Tests.csproj reference backend/PortailMediatheque.Api.csproj`
  - [ ] Create folder structure: `backend.Tests/Services/`, `backend.Tests/Controllers/`
  - [ ] Verify `dotnet test` runs successfully (AC: #3)

- [ ] Task 5: Final validation
  - [ ] Confirm `ng serve` → browser shows app bar with correct wordmark and "conviviale" in terracotta
  - [ ] Confirm warm parchment background (`#F8F5F0`) and Inter font visible
  - [ ] Confirm `dotnet run` → `GET http://localhost:5000/swagger` returns Swagger UI
  - [ ] Confirm all folder structures exist and are consistent with architecture document

## Dev Notes

### Stack Versions (MANDATORY — do not use older versions)

- **Angular: 21** (latest stable) — standalone components by default (`--standalone` is `true` by default since Angular 17+, no need to pass flag)
- **.NET: 10 LTS** (supported until November 2028) — C# 13
- **TypeScript: 5.x** — strict mode enabled by default with `ng new`
- **EF Core: 10** (matches .NET SDK version)
- **Angular Material: M3** — select M3 when prompted by `ng add @angular/material`

### Scaffolding Commands (EXACT — copy-paste)

```bash
# Frontend (run from repo root)
ng new portail-mediatheque-frontend --routing --style=scss
# Then move contents to frontend/

# Backend (run from repo root)
dotnet new webapi -n PortailMediatheque.Api --no-https --use-controllers
# Output is already in backend/ subfolder if you run from root OR rename

# Test project
dotnet new xunit -n backend.Tests

# Solution file
dotnet new sln -n PortailMediatheque
dotnet sln add backend/PortailMediatheque.Api.csproj
dotnet sln add backend.Tests/backend.Tests.csproj

# Backend packages (run from backend/)
dotnet add package Microsoft.EntityFrameworkCore.Sqlite
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet add package BCrypt.Net-Next
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer

# Angular Material (run from frontend/)
ng add @angular/material

# Inter font (run from frontend/)
npm install @fontsource/inter
```

### Critical: Monorepo Directory Structure

The target structure from architecture MUST be followed exactly:

```
portail-mediatheque-conviale/          ← git root (already exists)
├── .env.example
├── .gitignore
├── docker-compose.yml                 ← stub now, completed Story 1.4
├── docker-compose.override.yml        ← stub now, completed Story 1.4
├── nginx/
│   └── nginx.conf                     ← stub now, completed Story 1.4
├── frontend/                          ← ng new output
│   ├── angular.json
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── Dockerfile                     ← stub now, completed Story 1.4
│   └── src/
│       ├── main.ts
│       ├── index.html
│       ├── styles.scss
│       ├── environments/
│       │   ├── environment.ts         ← { apiUrl: 'http://localhost:5000' }
│       │   └── environment.prod.ts    ← { apiUrl: '/api' }
│       └── app/
│           ├── app.config.ts
│           ├── app.routes.ts
│           ├── features/
│           │   ├── catalog/
│           │   └── admin/             ← lazy-loaded
│           └── shared/
│               ├── components/
│               ├── services/
│               ├── models/
│               ├── interceptors/
│               └── guards/
├── backend/                           ← dotnet new webapi output
│   ├── PortailMediatheque.Api.csproj
│   ├── appsettings.json
│   ├── appsettings.Development.json
│   ├── Program.cs
│   ├── Dockerfile                     ← stub now, completed Story 1.4
│   ├── Controllers/
│   ├── Models/DTOs/
│   ├── Services/Interfaces/
│   ├── Data/Migrations/
│   └── Middleware/
└── backend.Tests/
    ├── backend.Tests.csproj
    ├── Services/
    └── Controllers/
```

### Angular app.config.ts Pattern (EXACT)

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideRouter, withScrollRestoration, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withScrollRestoration(), withComponentInputBinding()),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimationsAsync(),
  ]
};
```

**`withScrollRestoration()` is MANDATORY** — required by UX-DR13. Omitting it breaks back-navigation scroll behavior.

### Angular app.routes.ts Pattern (EXACT)

```typescript
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/catalog/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'livres/:id',
    loadComponent: () => import('./features/catalog/book-detail/book-detail.component').then(m => m.BookDetailComponent)
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.adminRoutes)
  },
  { path: '**', redirectTo: '' }
];
```

**Admin routes MUST be lazy-loaded** — the admin bundle must never be included in the public bundle (architecture decision).

### Angular Material M3 Warm Theme — styles.scss Pattern

```scss
@use '@angular/material' as mat;
@use '@fontsource/inter'; // Import Inter font

:root {
  --color-background: #F8F5F0;
  --color-surface: #FFFFFF;
  --color-on-surface: #1A1A1A;
  --color-on-surface-variant: #6B6561;
  --color-primary: #B85C38;
  --color-primary-container: #F4E4DC;
  --color-outline: #E8E3DD;
  --color-error: #BA1A1A;
  --color-success: #386A20;
}

html, body {
  height: 100%;
  margin: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background-color: var(--color-background);
  color: var(--color-on-surface);
}
```

### AppComponent Wordmark Pattern

The wordmark "Médiathèque conviviale" splits into two `<span>` elements:

```html
<mat-toolbar class="app-bar">
  <span class="wordmark">
    <span>Médiathèque </span>
    <span class="wordmark-accent">conviviale</span>
  </span>
  <span class="spacer"></span>
  <a mat-button routerLink="/admin" class="admin-link">Admin</a>
</mat-toolbar>
```

```scss
.wordmark-accent { color: #B85C38; }
.spacer { flex: 1 1 auto; }
.admin-link { opacity: 0.7; font-size: 0.85rem; } // discreet ghost button
```

### .NET Program.cs Pattern (EXACT — for this story)

```csharp
var builder = WebApplication.CreateBuilder(args);

// CORS — read allowed origins from config
var corsOrigins = builder.Configuration["Cors:AllowedOrigins"]?.Split(',')
    ?? new[] { "http://localhost:4200" };

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(corsOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod());
});

builder.Services.AddControllers();

// Swagger only in development
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();
}

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseAuthorization();
app.MapControllers();

app.Run();
```

**CRITICAL: Swagger must NOT be registered or exposed in production.** Check with `app.Environment.IsDevelopment()`.

### Naming Conventions (MANDATORY)

Do NOT deviate from these. All future stories build on these patterns.

| Element | Convention | Example |
|---|---|---|
| Angular component class | PascalCase + `Component` | `BookListItemComponent` |
| Angular component file | kebab-case | `book-list-item.component.ts` |
| Angular service class | PascalCase + `Service` | `BookService` |
| Angular model/interface | PascalCase | `Book`, `AdminCredentials` |
| Angular observable property | camelCase + `$` suffix | `books$` |
| C# class | PascalCase | `BookService`, `BooksController` |
| C# interface | `I` prefix | `IBookService` |
| C# async method | PascalCase + `Async` suffix | `GetAllAsync()` |
| C# private field | camelCase + `_` prefix | `_context`, `_configuration` |
| Route paths | kebab-case | `/admin/livres/nouveau` |
| JSON fields | camelCase (System.Text.Json default — never override) | `"dateAdded"`, `"isSelectionDuMois"` |

### Anti-Patterns to Avoid (Architecture-Enforced)

| Anti-pattern | Correct approach |
|---|---|
| Using NgModules | Standalone components only (Angular 17+ default) |
| Using `scrollPositionRestoration: 'disabled'` | Always `withScrollRestoration()` in `app.config.ts` |
| Hardcoding API URL | Always use `environment.apiUrl` |
| Adding Swagger in production | Swagger registered + served ONLY in `IsDevelopment()` block |
| Using `ng new --no-standalone` | Standalone is default and required |
| `PascalCase` JSON field names from .NET | System.Text.Json default is camelCase — do not add any custom naming policy |
| Committing `.env` file | Only `.env.example` is committed — `.env` must be in `.gitignore` |

### Environment Variables (`.env.example` content)

```dotenv
# Admin credentials (seeded on first startup — Story 1.2)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me-secure-password

# JWT secret (Story 1.2)
JWT_SECRET=replace-with-at-least-32-char-random-string

# Google Books API key (Story 6.1)
GOOGLE_BOOKS_API_KEY=your-google-books-api-key

# CORS (production domain — Story 1.4)
CORS_ORIGIN=https://your-production-domain.com
```

### Project Structure Notes

- **Monorepo root = git root** (`portail-mediatheque-conviale/`) — all paths relative to this
- `frontend/` output must match `ng new` output, not nested further
- `backend/` and `backend.Tests/` are separate .NET projects in a single solution (`PortailMediatheque.sln`)
- `Data/Migrations/` is generated by EF Core (Story 1.2) — create the empty folder now but never hand-edit its contents
- Placeholder component files should be minimal valid standalone Angular components (one `@Component` decorator, empty template)
- Placeholder service files should export an injectable class with `@Injectable({ providedIn: 'root' })` — no methods yet

### References

- Architecture scaffolding commands: [architecture.md — Implementation Handoff section](../_bmad-output/planning-artifacts/architecture.md)
- Complete project directory structure: [architecture.md — Complete Project Directory Structure](../_bmad-output/planning-artifacts/architecture.md)
- Naming conventions: [architecture.md — Naming Patterns](../_bmad-output/planning-artifacts/architecture.md)
- Angular Material M3 theme: [epics.md — UX-DR1, UX-DR2](../_bmad-output/planning-artifacts/epics.md)
- App bar wordmark spec: [epics.md — UX-DR17](../_bmad-output/planning-artifacts/epics.md)
- Story acceptance criteria: [epics.md — Story 1.1](../_bmad-output/planning-artifacts/epics.md)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List

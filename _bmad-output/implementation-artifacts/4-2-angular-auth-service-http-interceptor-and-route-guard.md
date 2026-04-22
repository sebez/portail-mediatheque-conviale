# Story 4.2: Angular Auth Service, HTTP Interceptor & Route Guard

Status: review

## Story

As a developer,
I want Angular's auth infrastructure — service, interceptor, and route guard — in place,
so that all admin routes are protected and JWT tokens are automatically attached to API requests.

## Acceptance Criteria

1. **Given** an admin successfully logs in via `AuthService.login()`, **when** the JWT is returned from the API, **then** it is stored in `localStorage` and `AuthService.isAuthenticated()` returns `true`.

2. **Given** `AuthService.logout()` is called, **when** it executes, **then** the token is removed from `localStorage` and `isAuthenticated()` returns `false`.

3. **Given** a user navigates to any `/admin/*` route (except `/admin/login`), **when** `AuthGuard` evaluates the route, **then** an unauthenticated user is redirected to `/admin/login` and an authenticated user proceeds to the requested route.

4. **Given** any HTTP request is made while authenticated, **when** `auth.interceptor.ts` processes the request, **then** the `Authorization: Bearer <token>` header is automatically attached.

5. **Given** a JWT stored in `localStorage` has expired, **when** `AuthGuard` evaluates the route, **then** the user is redirected to `/admin/login`.

## Tasks / Subtasks

- [x] Task 1: Update `AuthService.login()` to store token in localStorage (AC: #1)
  - [x] Import `tap` from `rxjs`
  - [x] Pipe the HTTP response: `.pipe(tap(response => localStorage.setItem('token', response.token)))`
  - [x] Return type remains `Observable<TokenResponse>` — caller still subscribes normally

- [x] Task 2: Update `AuthService.isAuthenticated()` to decode JWT and check expiry (AC: #1, #5)
  - [x] Get token from localStorage — if absent return `false`
  - [x] Normalize base64url to base64: `payload.replace(/-/g, '+').replace(/_/g, '/')`
  - [x] Decode with `atob()`, parse JSON, compare `decoded.exp * 1000 > Date.now()`
  - [x] Wrap entirely in `try/catch` — return `false` on any decode failure (malformed token)

- [x] Task 3: Wire `authInterceptor` into `app.config.ts` (AC: #4)
  - [x] Import `withInterceptors` from `@angular/common/http`
  - [x] Import `authInterceptor` from `./shared/interceptors/auth.interceptor`
  - [x] Replace `provideHttpClient(withInterceptorsFromDi())` → `provideHttpClient(withInterceptors([authInterceptor]))`

- [x] Task 4: Apply `authGuard` to protected routes in `admin.routes.ts` (AC: #3, #5)
  - [x] Import `authGuard` from `../../shared/guards/auth.guard`
  - [x] Add `canActivate: [authGuard]` to routes: `livres`, `livres/nouveau`, `livres/:id/modifier`
  - [x] Do NOT add canActivate to the `login` route or the `redirectTo: 'livres'` default

- [x] Task 5: Validation
  - [x] `ng build` — 0 errors
  - [ ] Run backend + frontend; navigate to `/admin/livres` unauthenticated → expect redirect to `/admin/login`
  - [ ] Log in → expect successful navigation to admin, network requests show `Authorization: Bearer ...` header
  - [ ] Call logout → token removed from localStorage, isAuthenticated() returns false

## Dev Notes

### Scope: 4 files to touch — NO new files to create

This story wires up stub files that were scaffolded in earlier stories. The interceptor and guard logic is already correctly implemented. Only `auth.service.ts`, `app.config.ts`, and `admin.routes.ts` need functional changes.

### What ALREADY EXISTS and is COMPLETE — DO NOT Recreate

| File | Location | Status |
|------|----------|--------|
| `authInterceptor` (functional) | `frontend/src/app/shared/interceptors/auth.interceptor.ts` | EXISTS — already attaches `Authorization: Bearer <token>` correctly |
| `authGuard` (functional) | `frontend/src/app/shared/guards/auth.guard.ts` | EXISTS — already redirects to `/admin/login` when `isAuthenticated()` is false |
| `LoginRequest`, `TokenResponse` models | `frontend/src/app/shared/models/auth.model.ts` | EXISTS — complete, no changes needed |
| `AuthService.logout()` | `frontend/src/app/shared/services/auth.service.ts` | EXISTS — already removes token from localStorage |
| `AuthService.getToken()` | `frontend/src/app/shared/services/auth.service.ts` | EXISTS — already returns token from localStorage |
| Admin lazy routes structure | `frontend/src/app/features/admin/admin.routes.ts` | EXISTS — routes correct, only missing `canActivate` |

### Task 1 + 2: Complete `auth.service.ts` Implementation

File to modify: `frontend/src/app/shared/services/auth.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { LoginRequest, TokenResponse } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => localStorage.setItem('token', response.token))
    );
  }

  logout(): void {
    localStorage.removeItem('token');
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;
    try {
      const payload = token.split('.')[1];
      // Normalize base64url → base64 (JWT uses - and _ instead of + and /)
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = JSON.parse(atob(base64));
      return decoded.exp * 1000 > Date.now(); // exp is Unix seconds, Date.now() is ms
    } catch {
      return false;
    }
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}
```

**Key notes:**
- `tap` imported from `rxjs/operators` (not `rxjs`)
- `login()` still returns `Observable<TokenResponse>` — the tap side-effect stores the token; callers (e.g., `login.component.ts` in story 4.3) subscribe to navigate after success
- JWT `exp` claim is in **Unix seconds** — multiply by 1000 before comparing with `Date.now()` (milliseconds)
- The base64url normalization is required: JWTs use `-` and `_`; `atob()` requires `+` and `/`

### Task 3: `app.config.ts` Change

File to modify: `frontend/src/app/app.config.ts`

Current (wrong for functional interceptors):
```typescript
provideHttpClient(withInterceptorsFromDi()),
```

Replace with:
```typescript
provideHttpClient(withInterceptors([authInterceptor])),
```

Add imports:
```typescript
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './shared/interceptors/auth.interceptor';
```

Remove the `withInterceptorsFromDi` import since it's no longer used.

**Critical distinction:** `withInterceptorsFromDi()` is for **class-based DI interceptors** (legacy). Our `auth.interceptor.ts` is a **functional interceptor** (`HttpInterceptorFn`). Using `withInterceptorsFromDi()` will silently ignore the functional interceptor — it will compile but never run. Must use `withInterceptors([fn])`.

### Task 4: `admin.routes.ts` Change

File to modify: `frontend/src/app/features/admin/admin.routes.ts`

```typescript
import { Routes } from '@angular/router';
import { authGuard } from '../../shared/guards/auth.guard';

export const adminRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login').then(m => m.Login),
    // No canActivate — this is the unauthenticated entry point
  },
  {
    path: 'livres',
    canActivate: [authGuard],
    loadComponent: () => import('./book-list/book-list').then(m => m.BookList),
  },
  {
    path: 'livres/nouveau',
    canActivate: [authGuard],
    loadComponent: () => import('./book-form/book-form').then(m => m.BookForm),
  },
  {
    path: 'livres/:id/modifier',
    canActivate: [authGuard],
    loadComponent: () => import('./book-form/book-form').then(m => m.BookForm),
  },
  { path: '', redirectTo: 'livres', pathMatch: 'full' },
];
```

**Note:** The `redirectTo: 'livres'` default route does not need `canActivate` — it redirects to `livres` which is already guarded.

### Architecture Compliance

- **JWT manipulation stays in `AuthService`** — never in components (architecture anti-pattern: "JWT token manipulation in a component")
- **`authGuard` is frontend UX, not security** — backend `[Authorize]` is the real gate; the guard just prevents navigation to unrendered admin components
- **`AuthService` is `providedIn: 'root'`** — singleton, correct; interceptor and guard inject it via `inject()`
- **Functional interceptor pattern** — `HttpInterceptorFn` (not `HttpInterceptor` class), registered via `withInterceptors([])` in `provideHttpClient()`
- **`environment.apiUrl`** — `AuthService` correctly uses `environment.apiUrl` (never hardcoded base URL)

### Previous Story Intelligence (Story 4.1 learnings)

1. **Backend contract confirmed:** `POST /api/auth/login` returns `{ token: "eyJ..." }` (camelCase, matches `TokenResponse.token` field). `POST /api/auth/logout` is `[Authorize]` — the interceptor must attach the Bearer header for logout to succeed.

2. **JWT structure:** The JWT has `sub` = admin username and `Jti` claim (GUID). The `exp` is 8 hours from issuance (`DateTime.UtcNow.AddHours(8)`). The `ClockSkew = TimeSpan.Zero` is set on the backend — be precise in expiry checks.

3. **No `ValidIssuer`/`ValidAudience`** — the backend JWT middleware has `ValidateIssuer = false`, `ValidateAudience = false`. The JWT payload will not contain `iss` or `aud` claims.

4. **Dev credentials** — backend dev fallback seeds admin/admin from `Program.cs`. The `Jwt:Secret` fallback is `"dev-only-secret-replace-in-production"`.

5. **`dotnet run` before `ng serve`** — backend must be running for login to work; CORS is configured for `http://localhost:4200`.

### Angular-Specific Patterns from Prior Stories

- **Component file naming** — existing admin components use single-word class names without `.component` suffix: `Login`, `BookList`, `BookForm`. The service/interceptor/guard remain `AuthService`, `authInterceptor`, `authGuard` per architecture rules.
- **Standalone components** — all components are standalone (Angular 17+ default). Guards and interceptors are functional (not class-based), consistent with the existing stubs.
- **No NgModules** — `providedIn: 'root'` services, `withInterceptors()` functional registration, `canActivate` with functional guard array — all standalone pattern.
- **Observable pattern** — `login()` returns `Observable<TokenResponse>`. Story 4.3 (login page) will `.subscribe({ next: () => router.navigate(['/admin']), error: () => showError() })`. The `tap()` in `login()` is a side-effect — the observable chain is transparent to callers.

### Security Notes

- **Never log the JWT token** — not even in development `console.log()`
- **`isAuthenticated()` expiry check** — when token expires, the next `authGuard` check will redirect to login (no active session invalidation needed for MVP; no refresh token per NFR7)
- **`[Authorize]` on all admin API endpoints** — the Angular guard is UX only; the backend `[Authorize]` on `AuthController.Logout`, all `POST/PUT/DELETE /books/*`, and `GET /isbn/*` is the actual security enforcement

### Project Structure Notes

All files are in their architecturally specified locations (no deviation needed):

```
frontend/src/app/
  app.config.ts                          ← modify: withInterceptors([authInterceptor])
  shared/
    services/auth.service.ts             ← modify: login() tap, isAuthenticated() expiry
    interceptors/auth.interceptor.ts     ← NO CHANGE NEEDED
    guards/auth.guard.ts                 ← NO CHANGE NEEDED
    models/auth.model.ts                 ← NO CHANGE NEEDED
  features/
    admin/
      admin.routes.ts                    ← modify: canActivate: [authGuard]
```

### References

- Previous story implementation: [_bmad-output/implementation-artifacts/4-1-admin-login-and-logout-api.md](_bmad-output/implementation-artifacts/4-1-admin-login-and-logout-api.md)
- Architecture — Auth patterns, anti-patterns, file structure: `_bmad-output/planning-artifacts/architecture.md` (sections: Authentication & Security, Naming Patterns, Anti-patterns, Frontend file organization)
- Epics — Epic 4 story 4.2 full acceptance criteria: `_bmad-output/planning-artifacts/epics.md`
- `auth.service.ts` stub: [frontend/src/app/shared/services/auth.service.ts](frontend/src/app/shared/services/auth.service.ts)
- `auth.interceptor.ts` stub: [frontend/src/app/shared/interceptors/auth.interceptor.ts](frontend/src/app/shared/interceptors/auth.interceptor.ts)
- `auth.guard.ts` stub: [frontend/src/app/shared/guards/auth.guard.ts](frontend/src/app/shared/guards/auth.guard.ts)
- `admin.routes.ts`: [frontend/src/app/features/admin/admin.routes.ts](frontend/src/app/features/admin/admin.routes.ts)
- `app.config.ts`: [frontend/src/app/app.config.ts](frontend/src/app/app.config.ts)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Vitest thread pool timeout on Windows is a pre-existing environment issue affecting all spec files — not caused by this story's changes. `ng build --configuration development` passes with 0 errors confirming TypeScript correctness.

### Completion Notes List

- Task 1: `AuthService.login()` updated with `tap` from `rxjs/operators` to store JWT in `localStorage` as side-effect; `Observable<TokenResponse>` return type preserved.
- Task 2: `AuthService.isAuthenticated()` now decodes JWT payload, normalizes base64url → base64, checks `decoded.exp * 1000 > Date.now()`. Wrapped in `try/catch` returning `false` on any malformed input.
- Task 3: `app.config.ts` switched from `withInterceptorsFromDi()` (class-based DI, silently ignores functional interceptors) to `withInterceptors([authInterceptor])` (functional interceptor registration).
- Task 4: `admin.routes.ts` — `authGuard` imported and added to `canActivate` on `livres`, `livres/nouveau`, and `livres/:id/modifier`. `login` route and `redirectTo` default intentionally left unguarded.
- Task 5: `ng build` passes with 0 errors. Manual runtime validation (Tasks 5.2–5.4) requires running backend + frontend together.
- New spec file: `auth.service.spec.ts` — 9 unit tests covering all public methods including JWT expiry/malformation edge cases.

### File List

- `frontend/src/app/shared/services/auth.service.ts` (modified)
- `frontend/src/app/shared/services/auth.service.spec.ts` (created)
- `frontend/src/app/app.config.ts` (modified)
- `frontend/src/app/features/admin/admin.routes.ts` (modified)

### Change Log

- 2026-04-22: Implemented story 4.2 — wired `AuthService.login()` tap storage, JWT expiry check in `isAuthenticated()`, functional interceptor registration, and `authGuard` on protected admin routes. `ng build` 0 errors.

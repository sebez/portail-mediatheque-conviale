# Story 4.3: Admin Login Page & Admin App Shell

Status: ready-for-dev

## Story

As the library animator,
I want a login page to enter my credentials and an admin interface with a dark app bar and logout button,
so that I can access and exit the admin interface quickly from my smartphone.

## Acceptance Criteria

1. **Given** a user navigates to `/admin/login`, **when** the page renders, **then** a single-column login form is shown with username and password fields and a full-width "Se connecter" primary button, and the public app bar is NOT shown — the login page has its own minimal header.

2. **Given** the admin submits valid credentials, **when** `AuthService.login()` returns a JWT, **then** the user is redirected to `/admin`.

3. **Given** the admin submits invalid credentials, **when** the API returns 401, **then** an inline error message is shown below the form — no page reload, no modal.

4. **Given** the admin is on any `/admin/*` page (except `/admin/login`), **when** the page renders, **then** the admin app bar is dark (`#1A1A1A`), shows the current page title centered, and shows a logout icon button on the right.

5. **Given** the admin taps the logout icon button, **when** `AuthService.logout()` is called, **then** the token is cleared and the user is redirected to `/`.

6. **Given** a public user loads the homepage, **when** network requests are inspected, **then** the admin bundle is not loaded (lazy-loaded, separate chunk).

## Tasks / Subtasks

- [ ] Task 1: Replace `Login` stub with Reactive Form implementation (AC: #1, #2, #3)
  - [ ] Add `standalone: true` to `@Component` decorator and import `ReactiveFormsModule`, all required Angular Material modules
  - [ ] Inject `FormBuilder`, `AuthService`, `Router` via `inject()`
  - [ ] Build `FormGroup` with `username` and `password` controls (both `Validators.required`)
  - [ ] Add `isLoading = false` and `errorMessage = ''` instance properties
  - [ ] Implement `onSubmit()`: guard on `form.invalid || isLoading`, set `isLoading = true`, clear `errorMessage`, call `authService.login()`, on `next` navigate to `/admin`, on `error` set `isLoading = false` and set `errorMessage` from status (401 → "Identifiants incorrects. Veuillez réessayer.", other → "Une erreur est survenue. Veuillez réessayer.")
  - [ ] Template: minimal centered header (no dark toolbar), single-column `mat-card` form, `mat-form-field` for username and password, password field type `"password"`, full-width `mat-raised-button` "Se connecter" with `[disabled]="isLoading"`, inline `<mat-error>` or `<p>` error text below form bound to `errorMessage`

- [ ] Task 2: Create `AdminShell` layout component (AC: #4, #5)
  - [ ] Create `frontend/src/app/features/admin/admin-shell/admin-shell.ts`
  - [ ] Standalone component importing `RouterOutlet`, `MatToolbarModule`, `MatIconModule`, `MatButtonModule` (for `matIconButton`)
  - [ ] Inject `Router`, `ActivatedRoute`, `AuthService`
  - [ ] Add `pageTitle = signal('')` property
  - [ ] Implement `ngOnInit()`: call `updateTitle()` once on init, subscribe to `router.events.pipe(filter(e => e instanceof NavigationEnd))` to call `updateTitle()` on each navigation
  - [ ] Implement private `updateTitle()`: walk `this.activatedRoute.snapshot` down through `firstChild` to deepest child, set `pageTitle` from `route.data['title'] ?? ''`
  - [ ] Implement `logout()`: call `authService.logout()` then `router.navigate(['/'])`
  - [ ] Template: `<mat-toolbar>` with `style="background: #1A1A1A; color: white;"`, flex spacer left + centered title span + flex spacer right + `mat-icon-button` logout icon on the far right; `<router-outlet />` below toolbar

- [ ] Task 3: Update `admin.routes.ts` to use `AdminShell` as parent layout (AC: #4, #6)
  - [ ] Keep `path: 'login'` as a sibling (not inside the shell)
  - [ ] Add a parent route `path: ''` with `canActivate: [authGuard]` and `loadComponent` pointing to `AdminShell`
  - [ ] Move `livres`, `livres/nouveau`, `livres/:id/modifier`, and the `redirectTo` default into the `children` array of the shell route
  - [ ] Add `data: { title: 'Livres' }` to the `livres` route
  - [ ] Add `data: { title: 'Ajouter un livre' }` to the `livres/nouveau` route
  - [ ] Add `data: { title: 'Modifier un livre' }` to the `livres/:id/modifier` route
  - [ ] Remove individual `canActivate: [authGuard]` from child routes (guard is now on parent shell)

- [ ] Task 4: Validation
  - [ ] `ng build` — 0 errors
  - [ ] Run backend + frontend; navigate to `/admin` unauthenticated → expect redirect to `/admin/login`
  - [ ] Login with valid credentials → expect dark app bar visible, "Livres" title centered, logout icon on the right
  - [ ] Navigate to `/admin/livres/nouveau` → app bar shows "Ajouter un livre"
  - [ ] Tap logout → token cleared, redirected to `/`
  - [ ] On the public homepage, inspect Network panel → no admin chunk loaded

## Dev Notes

### Scope: 3 files to modify/create

| Action | File | Notes |
|--------|------|-------|
| Replace stub | `frontend/src/app/features/admin/login/login.ts` | Full implementation; component class is `Login` (keep selector `app-login`) |
| Create new | `frontend/src/app/features/admin/admin-shell/admin-shell.ts` | New layout component with `<mat-toolbar>` + `<router-outlet>` |
| Modify | `frontend/src/app/features/admin/admin.routes.ts` | Add shell as parent with children; consolidate `canActivate` to shell |

### What ALREADY EXISTS and is COMPLETE — DO NOT Recreate

| File | Location | Status |
|------|----------|--------|
| `AuthService` (complete) | `frontend/src/app/shared/services/auth.service.ts` | login, logout, isAuthenticated, getToken — fully implemented in story 4.2 |
| `authGuard` (functional) | `frontend/src/app/shared/guards/auth.guard.ts` | redirects to `/admin/login` when not authenticated |
| `authInterceptor` (functional) | `frontend/src/app/shared/interceptors/auth.interceptor.ts` | attaches `Authorization: Bearer <token>` to all requests |
| `LoginRequest`, `TokenResponse` | `frontend/src/app/shared/models/auth.model.ts` | models for login — no changes needed |
| `admin.routes.ts` (partial) | `frontend/src/app/features/admin/admin.routes.ts` | routes exist but must be restructured for shell pattern |
| `Login` stub | `frontend/src/app/features/admin/login/login.ts` | placeholder only — full replacement required |
| Angular Material M3 theme | `frontend/src/styles.scss` | `--color-primary: #B85C38`, full palette already configured |

### Task 1: `login.ts` — Complete Implementation

File: `frontend/src/app/features/admin/login/login.ts`

**Critical:** The existing stub is a placeholder with `selector: 'app-login'`. Keep the selector. The class name stays `Login` (no `.component` suffix — established pattern from prior stories).

```typescript
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
  ],
  template: `
    <div class="login-container">
      <h1 class="login-title">Médiathèque <span class="accent">conviviale</span></h1>
      <mat-card class="login-card">
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Identifiant</mat-label>
              <input matInput formControlName="username" autocomplete="username" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Mot de passe</mat-label>
              <input matInput type="password" formControlName="password" autocomplete="current-password" />
            </mat-form-field>
            @if (errorMessage) {
              <p class="error-message" role="alert">{{ errorMessage }}</p>
            }
            <button
              mat-raised-button
              color="primary"
              type="submit"
              class="full-width submit-button"
              [disabled]="isLoading">
              {{ isLoading ? 'Connexion…' : 'Se connecter' }}
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px 16px;
      background: var(--color-background);
    }
    .login-title {
      font-size: 1.5rem;
      font-weight: 500;
      margin-bottom: 24px;
      color: var(--color-on-surface);
    }
    .accent { color: var(--color-primary); }
    .login-card { width: 100%; max-width: 360px; }
    .full-width { width: 100%; }
    .submit-button { margin-top: 8px; }
    .error-message {
      color: var(--color-error);
      font-size: 0.875rem;
      margin: 4px 0 12px;
    }
  `],
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });
  isLoading = false;
  errorMessage = '';

  onSubmit(): void {
    if (this.form.invalid || this.isLoading) return;
    this.isLoading = true;
    this.errorMessage = '';
    const { username, password } = this.form.value;
    this.authService.login({ username: username!, password: password! }).subscribe({
      next: () => this.router.navigate(['/admin']),
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.status === 401
          ? 'Identifiants incorrects. Veuillez réessayer.'
          : 'Une erreur est survenue. Veuillez réessayer.';
      },
    });
  }
}
```

**Key notes:**
- `color="primary"` on `mat-raised-button` uses the terracotta theme palette (UX-DR16: one primary button per screen)
- `form.invalid` check prevents submission with empty fields without triggering explicit validation UI
- `isLoading` disables button on in-flight request; guard at top of `onSubmit()` prevents duplicate submissions
- `autocomplete` attributes for password manager support on mobile (important for UX-DR10 mobile-first intent)
- `role="alert"` on error message so screen readers announce it without user focus (accessibility)
- No `mat-error` inside `mat-form-field` — the inline error paragraph below the form matches the AC spec ("inline error message shown below the form")

### Task 2: `admin-shell.ts` — New Layout Component

File: `frontend/src/app/features/admin/admin-shell/admin-shell.ts`

```typescript
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterOutlet, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../shared/services/auth.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, MatToolbarModule, MatButtonModule, MatIconModule],
  template: `
    <mat-toolbar class="admin-toolbar">
      <span class="spacer"></span>
      <span class="page-title">{{ pageTitle() }}</span>
      <span class="spacer"></span>
      <button mat-icon-button (click)="logout()" aria-label="Se déconnecter">
        <mat-icon>logout</mat-icon>
      </button>
    </mat-toolbar>
    <router-outlet />
  `,
  styles: [`
    .admin-toolbar {
      background: #1A1A1A;
      color: white;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .spacer { flex: 1; }
    .page-title { font-weight: 500; }
  `],
})
export class AdminShell implements OnInit {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private authService = inject(AuthService);

  pageTitle = signal('');

  ngOnInit(): void {
    this.updateTitle();
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.updateTitle());
  }

  private updateTitle(): void {
    let route = this.activatedRoute.snapshot;
    while (route.firstChild) {
      route = route.firstChild;
    }
    this.pageTitle.set(route.data['title'] ?? '');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
```

**Key notes:**
- `position: sticky; top: 0` keeps the app bar visible on scroll — important for long admin lists on mobile
- `pageTitle` is a signal (Angular 21 pattern) initialized in `ngOnInit` — avoids blank title flash on first load
- `updateTitle()` walks `activatedRoute.snapshot` down to the deepest child to find `data.title`; this resolves correctly because child routes are activated inside the shell's `router-outlet`
- The spacer pattern (flex: 1 on both sides of the title) centers the title regardless of logout button width

### Task 3: Updated `admin.routes.ts`

File: `frontend/src/app/features/admin/admin.routes.ts`

```typescript
import { Routes } from '@angular/router';
import { authGuard } from '../../shared/guards/auth.guard';

export const adminRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login').then(m => m.Login),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./admin-shell/admin-shell').then(m => m.AdminShell),
    children: [
      {
        path: 'livres',
        data: { title: 'Livres' },
        loadComponent: () => import('./book-list/book-list').then(m => m.BookList),
      },
      {
        path: 'livres/nouveau',
        data: { title: 'Ajouter un livre' },
        loadComponent: () => import('./book-form/book-form').then(m => m.BookForm),
      },
      {
        path: 'livres/:id/modifier',
        data: { title: 'Modifier un livre' },
        loadComponent: () => import('./book-form/book-form').then(m => m.BookForm),
      },
      { path: '', redirectTo: 'livres', pathMatch: 'full' },
    ],
  },
];
```

**Critical change from story 4.2:** The `canActivate: [authGuard]` that was on individual leaf routes is now on the parent shell route. Guard behavior is **identical** — unauthenticated navigation to any `/admin/*` (except `/admin/login`) still redirects to `/admin/login`. The guard runs once per navigation to any child route.

**Why shell pattern over individual guards:** Story 4.3 requires a shared dark app bar visible across all protected admin pages. The shell is the natural Angular solution — a parent layout component with `<router-outlet>` that all child views render inside.

### Architecture Compliance

- **`standalone: true`** on both `Login` and `AdminShell` — all components in this project are standalone (no NgModules)
- **Component class naming** — `Login` and `AdminShell` match the established pattern (no `.component` suffix): `BookList`, `BookForm`, `Login` (stories 1–4.2)
- **File naming** — `admin-shell.ts` (not `admin-shell.component.ts`) — architecture rule confirmed in story 4.2 dev notes
- **`inject()` not constructor injection** — Angular 14+ functional injection pattern used throughout this codebase
- **JWT manipulation stays in `AuthService`** — `Login` calls `authService.login()`, never touches `localStorage` directly
- **`environment.apiUrl`** — `AuthService` already uses it; `Login` doesn't need it (calls the service only)
- **Reactive Forms** — architecture mandates Reactive Forms for all admin forms; `FormBuilder` + `FormGroup` pattern
- **Dark toolbar color** — `#1A1A1A` matches UX-DR10 specification exactly
- **Lazy-loaded admin bundle** — `app.routes.ts` uses `loadChildren` for admin; this story does NOT change `app.routes.ts`; the lazy-loading guarantee is preserved

### Previous Story Intelligence (Story 4.2 learnings)

1. **`AuthService.login()` returns `Observable<TokenResponse>`** — caller must `.subscribe({ next: () => navigate, error: () => show error })`. The `tap()` side-effect stores the token internally; the subscriber only needs to handle navigation/error.

2. **JWT stored in `localStorage` key `'token'`** — set by the `tap` in `AuthService.login()`. Story 4.3 never reads or writes `localStorage` directly.

3. **`AuthService.logout()` is synchronous** — calls `localStorage.removeItem('token')` and returns void. Safe to call then immediately `router.navigate(['/'])`.

4. **`authGuard` redirects to `/admin/login`** — the guard already handles the redirect; no code in the shell or login component needs to re-implement this.

5. **Backend `POST /api/auth/login` returns HTTP 401** on invalid credentials — the error handler in `Login.onSubmit()` checks `err.status === 401` to differentiate invalid credentials from server errors.

6. **Backend dev credentials** — `admin` / `admin` (seeded in `Program.cs`). Backend must be running at `localhost:5000` for login to work; CORS allows `http://localhost:4200`.

7. **`ng build`** must pass with 0 errors — TypeScript strict mode is enforced; non-null assertions (`username!`, `password!`) are required because `FormGroup.value` returns `string | null`.

### Angular-Specific Patterns from Prior Stories

- **`inject()` pattern** — all recent components use `inject()` in the field initializer or constructor, not constructor parameter injection
- **Standalone imports** — every Angular Material module must be explicitly listed in the `imports: []` array; missing imports cause template compilation errors (silent in older Angular, error in Angular 21)
- **Signal for reactive UI** — `pageTitle = signal('')` preferred over a plain property; ensures change detection in the shell when navigating between child routes
- **`RouterOutlet` in standalone component** — must be imported from `@angular/router` and listed in `imports: []`; forgetting it causes blank child views with no error

### UX Compliance (UX-DR10, UX-DR16)

- **UX-DR10:** Dark admin app bar `#1A1A1A` — the shell toolbar uses this exact hex. Do NOT use `color="primary"` on `mat-toolbar` — that would apply the terracotta theme color, not `#1A1A1A`.
- **UX-DR16:** One primary button per screen max — the "Se connecter" button uses `mat-raised-button color="primary"` (terracotta). No other raised/primary buttons on the login screen.
- **Mobile-first** — the login card has `max-width: 360px` to look good on smartphone but doesn't break on desktop. Form fields are full-width.

### Project Structure Notes

New file to create:
```
frontend/src/app/features/admin/
  admin-shell/
    admin-shell.ts            ← NEW (layout component for protected admin pages)
  login/
    login.ts                  ← REPLACE stub
  admin.routes.ts             ← MODIFY (shell pattern, route data titles)
```

Files NOT to touch:
```
frontend/src/app/app.routes.ts              ← admin lazy-loading already correct
frontend/src/app/app.config.ts              ← auth interceptor already wired
frontend/src/app/shared/services/auth.service.ts    ← complete from story 4.2
frontend/src/app/shared/guards/auth.guard.ts        ← complete from story 4.2
frontend/src/app/shared/interceptors/auth.interceptor.ts  ← complete from story 4.2
```

### References

- Story 4.2 (previous, authoritative): [_bmad-output/implementation-artifacts/4-2-angular-auth-service-http-interceptor-and-route-guard.md](_bmad-output/implementation-artifacts/4-2-angular-auth-service-http-interceptor-and-route-guard.md)
- Epic 4 story 4.3 acceptance criteria: `_bmad-output/planning-artifacts/epics.md` (section "Story 4.3")
- Architecture — Frontend patterns, naming, anti-patterns: `_bmad-output/planning-artifacts/architecture.md` (sections: Frontend Architecture, Naming Patterns, Anti-patterns, Frontend file organization)
- UX spec — Admin UI: `_bmad-output/planning-artifacts/ux-design-specification.md` (UX-DR10, UX-DR16)
- `AuthService`: [frontend/src/app/shared/services/auth.service.ts](frontend/src/app/shared/services/auth.service.ts)
- `authGuard`: [frontend/src/app/shared/guards/auth.guard.ts](frontend/src/app/shared/guards/auth.guard.ts)
- `admin.routes.ts`: [frontend/src/app/features/admin/admin.routes.ts](frontend/src/app/features/admin/admin.routes.ts)
- `login.ts` stub: [frontend/src/app/features/admin/login/login.ts](frontend/src/app/features/admin/login/login.ts)
- `app.routes.ts` (lazy-load reference): [frontend/src/app/app.routes.ts](frontend/src/app/app.routes.ts)
- `styles.scss` (theme tokens): [frontend/src/styles.scss](frontend/src/styles.scss)

## Dev Agent Record

### Agent Model Used

_pending_

### Debug Log References

### Completion Notes List

### File List

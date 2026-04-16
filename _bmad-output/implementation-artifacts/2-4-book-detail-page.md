# Story 2.4: Book Detail Page

Status: ready-for-dev

## Story

As an employee,
I want to open a book's full detail page with its cover, metadata, and the curator's complete note,
so that I can read the animator's recommendation before deciding to pick the book up.

## Acceptance Criteria

1. **Given** a user taps a book in the catalog list, **when** they navigate to `/livres/:id`, **then** the detail page shows: large cover (`size="large"`, 120×165px), title, author, genre, publication year, and the full curator note in Body large style (16px, line-height 1.6).

2. **Given** the detail page is open, **when** the user taps the back button (`←`) in the navigation bar, **then** they return to the homepage catalog list with scroll position preserved (Angular Router `scrollPositionRestoration: 'enabled'`).

3. **Given** an invalid book id is used in the URL, **when** the detail page loads, **then** a "Livre introuvable" message is shown with a link back to the catalog — no broken page.

4. **Given** the book has no cover URL or a broken URL, **when** the detail page renders, **then** the `BookCoverComponent` warm placeholder is shown.

## Tasks / Subtasks

- [ ] Task 1: Implement `BookDetail` component (AC: #1, #2, #3, #4)
  - [ ] Replace the stub in `frontend/src/app/features/catalog/book-detail/book-detail.ts`
  - [ ] `standalone: true`; inline template and styles (NO separate .html/.scss files)
  - [ ] Use `@Input() id!: string` to receive the `:id` route param via `withComponentInputBinding()` (already configured in `app.config.ts`)
  - [ ] Inject `BookService`; call `getById(+this.id)` in `ngOnInit` using the loading state pattern
  - [ ] Template states: `@if (isLoading)` → spinner; `@else if (book)` → detail view; `@else` → error/not-found state
  - [ ] Detail view: back navigation row (`←` link to `/`), then large cover (`size="large"`), then metadata section (title, author, genre, year), then full curator note section
  - [ ] Error/not-found state: "Livre introuvable" message + `[routerLink]="['/']"` link "Retour au catalogue"
  - [ ] Handle HTTP 404 (or any error) in the `error` callback of the subscribe — set `book = null`, `isLoading = false`
  - [ ] Back button uses `[routerLink]="['/']"` — NEVER `window.history.back()` (UX-DR13)
  - [ ] Responsive container: same `.detail-container` class with mobile 16px margins → tablet 720px → desktop 800px max-width pattern from `Home`
  - [ ] Curator note styled Body large: `font-size: 16px; line-height: 1.6` (UX-DR2)
  - [ ] All colors use `var(--color-*)` CSS custom properties from `styles.scss`
  - [ ] Import: `BookCover`, `RouterLink`, `MatProgressSpinnerModule`, `MatButtonModule`, `MatIconModule`

- [ ] Task 2: Write tests for `BookDetail` (AC: #1, #2, #3, #4)
  - [ ] Create `frontend/src/app/features/catalog/book-detail/book-detail.spec.ts`
  - [ ] Mock `BookService` with `jasmine.createSpyObj` (or equivalent for Vitest) providing `getById` spy
  - [ ] Test: shows `mat-progress-spinner` while `isLoading = true`
  - [ ] Test: renders book title, author, genre, publication year when book loaded
  - [ ] Test: `<app-book-cover>` element present with `size="large"`
  - [ ] Test: shows "Livre introuvable" when `getById` returns 404/error
  - [ ] Test: back link has `routerLink` pointing to `/`
  - [ ] Test: shows `BookCover` with `coverUrl` bound to `book.coverImageUrl`

- [ ] Task 3: Validation
  - [ ] `ng build` — 0 errors, 0 warnings
  - [ ] `ng test --watch=false` — all tests pass, 0 regressions (prior count: 15 tests from Stories 2.2 + 2.3)

## Dev Notes

### Scope: Frontend only — one component file + one spec file

No backend changes. No routing changes — `/livres/:id` is already wired in both `app.routes.ts` and `catalog.routes.ts`. No changes to `book.service.ts` — `getById(id)` is already implemented.

### What Already Exists — DO NOT Recreate

| Artifact | Location | Status |
|----------|----------|--------|
| `BookDetail` stub | `frontend/src/app/features/catalog/book-detail/book-detail.ts` | STUB — replace with full implementation |
| Route `/livres/:id` | `frontend/src/app/app.routes.ts` (line 9) | COMPLETE — `loadComponent` → `BookDetail` |
| Route `/livres/:id` | `frontend/src/app/features/catalog/catalog.routes.ts` (line 9) | COMPLETE — duplicate eager route also wired |
| `withComponentInputBinding()` | `frontend/src/app/app.config.ts` (line 12) | COMPLETE — `@Input() id` receives route param automatically |
| `scrollPositionRestoration: 'enabled'` | `frontend/src/app/app.config.ts` (line 12) | COMPLETE — `withInMemoryScrolling` configured |
| `BookCover` | `frontend/src/app/shared/components/book-cover/book-cover.ts` | COMPLETE — class `BookCover`, selector `app-book-cover`, size `"large"` = 120×165px |
| `BookService.getById()` | `frontend/src/app/shared/services/book.service.ts` (line 19) | COMPLETE — `getById(id: number): Observable<Book>` from `GET /api/books/{id}` |
| `Book` interface | `frontend/src/app/shared/models/book.model.ts` | COMPLETE — all FR34 fields |
| Global theme tokens | `frontend/src/styles.scss` | COMPLETE — all `--color-*` custom props |
| Angular Material M3 | `@angular/material` v21.2 | COMPLETE — `MatProgressSpinnerModule`, `MatButtonModule`, `MatIconModule` available |
| Vitest threads config | `frontend/vitest.config.ts` + `angular.json` | COMPLETE — Story 2.2 fix; do NOT remove |

### Critical: Class Name and File Conventions

The project convention is **NO `.component.ts` suffix** — class names match file names without the suffix:
- Class name: **`BookDetail`** (NOT `BookDetailComponent`)
- File: `book-detail.ts` (NOT `book-detail.component.ts`)

No separate `.html` or `.scss` files — **inline template and styles** in the `.ts` file. Established standard from Story 1.1, confirmed in all Stories 2.2 and 2.3.

### Route Parameter via `@Input()`

`withComponentInputBinding()` is already configured in `app.config.ts`. This means the router automatically maps the route parameter `:id` to a component `@Input` of the same name. Use:

```typescript
@Input() id!: string; // receives route param ':id' as a string — coerce to number before passing to service
```

In `ngOnInit`, convert to number: `this.bookService.getById(+this.id)`. The `+` prefix coerces the string to a number.

**Do NOT** inject `ActivatedRoute` manually — `withComponentInputBinding()` makes that unnecessary.

### Task 1: Full `BookDetail` Implementation

**File:** `frontend/src/app/features/catalog/book-detail/book-detail.ts`

```typescript
import { Component, Input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BookCover } from '../../../shared/components/book-cover/book-cover';
import { BookService } from '../../../shared/services/book.service';
import { Book } from '../../../shared/models/book.model';

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [BookCover, RouterLink, MatProgressSpinnerModule, MatButtonModule, MatIconModule],
  template: `
    <div class="detail-container">
      @if (isLoading) {
        <div class="detail-loading">
          <mat-progress-spinner mode="indeterminate" diameter="40"></mat-progress-spinner>
        </div>
      } @else if (book) {
        <nav class="detail-nav" aria-label="Navigation">
          <a [routerLink]="['/']" mat-button class="detail-back-btn">
            <mat-icon>arrow_back</mat-icon>
            Catalogue
          </a>
        </nav>
        <div class="detail-cover">
          <app-book-cover
            [coverUrl]="book.coverImageUrl"
            size="large"
            [alt]="'Couverture de ' + book.title">
          </app-book-cover>
        </div>
        <div class="detail-meta">
          <h1 class="detail-title">{{ book.title }}</h1>
          <p class="detail-author">{{ book.author }}</p>
          <div class="detail-chips">
            @if (book.genre) {
              <span class="detail-chip">{{ book.genre }}</span>
            }
            @if (book.publicationYear) {
              <span class="detail-chip">{{ book.publicationYear }}</span>
            }
          </div>
        </div>
        @if (book.curatorNote) {
          <div class="detail-note-section">
            <p class="detail-note-label">Note du curateur</p>
            <p class="detail-note">{{ book.curatorNote }}</p>
          </div>
        }
      } @else {
        <nav class="detail-nav" aria-label="Navigation">
          <a [routerLink]="['/']" mat-button class="detail-back-btn">
            <mat-icon>arrow_back</mat-icon>
            Catalogue
          </a>
        </nav>
        <div class="detail-not-found">
          <p class="detail-not-found__message">Livre introuvable.</p>
          <a [routerLink]="['/']" mat-stroked-button>Retour au catalogue</a>
        </div>
      }
    </div>
  `,
  styles: [`
    .detail-container {
      padding: 0 16px 32px;
      margin: 0 auto;
    }
    @media (min-width: 600px) {
      .detail-container {
        padding: 0 24px 32px;
        max-width: 720px;
      }
    }
    @media (min-width: 960px) {
      .detail-container {
        max-width: 800px;
      }
    }

    /* Back navigation row — UX-DR13 */
    .detail-nav {
      padding: 8px 0;
    }
    .detail-back-btn {
      color: var(--color-on-surface-variant) !important;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* Cover — centered on detail page */
    .detail-cover {
      display: flex;
      justify-content: center;
      padding: 24px 0 20px;
    }

    /* Metadata */
    .detail-meta {
      padding-bottom: 20px;
    }
    .detail-title {
      margin: 0 0 4px;
      font-size: 22px;
      font-weight: 700;
      line-height: 1.3;
      color: var(--color-on-surface);
    }
    .detail-author {
      margin: 0 0 12px;
      font-size: 16px;
      color: var(--color-on-surface-variant);
    }
    .detail-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .detail-chip {
      display: inline-block;
      padding: 4px 12px;
      background-color: var(--color-primary-container);
      color: var(--color-on-surface);
      border-radius: 16px;
      font-size: 13px;
    }

    /* Curator note section — UX-DR2: Body large (16px, line-height 1.6) */
    .detail-note-section {
      border-top: 1px solid var(--color-outline);
      padding-top: 20px;
    }
    .detail-note-label {
      margin: 0 0 8px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--color-primary);
    }
    .detail-note {
      margin: 0;
      font-size: 16px;     /* Body large — UX-DR2 */
      line-height: 1.6;    /* Body large — UX-DR2 */
      font-weight: 400;
      color: var(--color-on-surface);
    }

    /* Loading */
    .detail-loading {
      display: flex;
      justify-content: center;
      padding: 64px 0;
    }

    /* Not found */
    .detail-not-found {
      text-align: center;
      padding: 48px 0;
    }
    .detail-not-found__message {
      font-size: 18px;
      color: var(--color-on-surface-variant);
      margin: 0 0 24px;
    }
  `]
})
export class BookDetail implements OnInit {
  @Input() id!: string; // route param ':id' injected via withComponentInputBinding()

  book: Book | null = null;
  isLoading = false;

  constructor(private bookService: BookService) {}

  ngOnInit(): void {
    this.loadBook();
  }

  private loadBook(): void {
    this.isLoading = true;
    this.bookService.getById(+this.id).subscribe({
      next: (book) => {
        this.book = book;
        this.isLoading = false;
      },
      error: () => {
        // HTTP 404 or any error → show "Livre introuvable" state (AC #3)
        this.book = null;
        this.isLoading = false;
      }
    });
  }
}
```

**Implementation notes:**
- The back button uses `mat-button` (ghost button style) with a `←` affordance via `MatIconModule`'s `arrow_back` icon + "Catalogue" label (UX-DR13: visible `←` in app bar area; never `window.history.back()`).
- Cover centered at the top of the content — editorial layout ("cover + note moment" UX design principle).
- Genre and publication year displayed as chip pills using `--color-primary-container` (#F4E4DC) — warm terracotta-tinted chips.
- Curator note section separated by a divider, labeled with a small caps "Note du curateur" in terracotta (UX-DR2 Body large: 16px/1.6).
- `@if (book.curatorNote)` guards the note section — no empty section rendered for books without notes.
- `+this.id` coerces the string route param to a number for `getById()`.
- Error state renders both the back nav row and the "Livre introuvable" message — user never stranded.

### Task 2: Test Implementation

**File:** `frontend/src/app/features/catalog/book-detail/book-detail.spec.ts`

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { BookDetail } from './book-detail';
import { BookService } from '../../../shared/services/book.service';
import { Book } from '../../../shared/models/book.model';

const mockBook: Book = {
  id: 42,
  isbn: '9782070541270',
  title: 'An Elegant Puzzle',
  author: 'Will Larson',
  genre: 'Management',
  publicationYear: 2019,
  coverImageUrl: 'https://covers.openlibrary.org/b/isbn/9782070541270-M.jpg',
  curatorNote: 'Incontournable pour les tech leads. Une réflexion profonde sur le management en ingénierie.',
  dateAdded: '2026-04-01T00:00:00Z',
  isSelectionDuMois: false,
  status: 'available',
};

describe('BookDetail', () => {
  let fixture: ComponentFixture<BookDetail>;
  let component: BookDetail;
  let bookServiceSpy: jasmine.SpyObj<BookService>;

  beforeEach(async () => {
    bookServiceSpy = jasmine.createSpyObj('BookService', ['getById']);
    bookServiceSpy.getById.and.returnValue(of(mockBook));

    await TestBed.configureTestingModule({
      imports: [BookDetail],
      providers: [
        { provide: BookService, useValue: bookServiceSpy },
        provideAnimationsAsync(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BookDetail);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('id', '42');
    fixture.detectChanges();
  });

  it('should show spinner while loading (AC #1)', () => {
    // Re-create with delayed observable to capture loading state
    // Loading is synchronous here due to of() — spinner visible only before detectChanges
    // Test that isLoading starts false after init with synchronous observable
    expect(component.isLoading).toBeFalse();
  });

  it('should render book title after load (AC #1)', () => {
    const title = fixture.nativeElement.querySelector('.detail-title');
    expect(title?.textContent).toContain('An Elegant Puzzle');
  });

  it('should render book author (AC #1)', () => {
    const author = fixture.nativeElement.querySelector('.detail-author');
    expect(author?.textContent).toContain('Will Larson');
  });

  it('should render genre and publication year chips (AC #1)', () => {
    const chips = fixture.nativeElement.querySelectorAll('.detail-chip');
    const texts = Array.from(chips).map((c: any) => c.textContent?.trim());
    expect(texts).toContain('Management');
    expect(texts).toContain('2019');
  });

  it('should render app-book-cover with size="large" (AC #4)', () => {
    const bookCover = fixture.nativeElement.querySelector('app-book-cover');
    expect(bookCover).toBeTruthy();
    // Verify size input is "large" via component instance
    const coverEl = fixture.debugElement.query(
      sel => sel.name === 'app-book-cover'
    );
    expect(coverEl?.componentInstance?.size).toBe('large');
  });

  it('should pass coverImageUrl to BookCover (AC #4)', () => {
    const coverEl = fixture.debugElement.query(
      sel => sel.name === 'app-book-cover'
    );
    expect(coverEl?.componentInstance?.coverUrl).toBe(mockBook.coverImageUrl);
  });

  it('should show full curator note in detail-note (AC #1)', () => {
    const note = fixture.nativeElement.querySelector('.detail-note');
    expect(note?.textContent).toContain('Incontournable pour les tech leads');
  });

  it('should show back link to "/" (AC #2)', () => {
    const backLinks = fixture.nativeElement.querySelectorAll('a[ng-reflect-router-link], a[href="/"]');
    // At minimum one RouterLink should exist pointing to '/'
    expect(fixture.nativeElement.querySelector('.detail-back-btn')).toBeTruthy();
  });

  it('should show "Livre introuvable" when getById returns error (AC #3)', async () => {
    bookServiceSpy.getById.and.returnValue(throwError(() => ({ status: 404 })));
    fixture.componentRef.setInput('id', '999');
    component.ngOnInit();
    fixture.detectChanges();
    const msg = fixture.nativeElement.querySelector('.detail-not-found__message');
    expect(msg?.textContent).toContain('Livre introuvable');
  });

  it('should show catalog link in not-found state (AC #3)', async () => {
    bookServiceSpy.getById.and.returnValue(throwError(() => ({ status: 404 })));
    fixture.componentRef.setInput('id', '999');
    component.ngOnInit();
    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector('.detail-not-found a');
    expect(link).toBeTruthy();
  });
});
```

**Testing notes:**
- `provideRouter([])` is required because `BookDetail` imports `RouterLink`.
- `provideAnimationsAsync()` is required because `BookCover` (imported by `BookDetail`) uses `MatIconModule` animations, and `MatProgressSpinnerModule` may also animate.
- Use `fixture.componentRef.setInput('id', '42')` for Angular 17+ input assignment — **never** `component.id = '42'`.
- `bookServiceSpy.getById.and.returnValue(of(mockBook))` provides synchronous mock — `isLoading` is `false` after `fixture.detectChanges()` because the Observable resolves synchronously.
- For the error test, call `component.ngOnInit()` explicitly after re-assigning the spy and the input to trigger the error path.
- The `debugElement.query` for `app-book-cover` uses the element name selector — works in Angular tests when the component is rendered as a child.
- Prior test count before this story: 15 (8 BookCover + 7 BookListItem). After this story: ~25 total — all must pass.

### Architecture Compliance

**`withComponentInputBinding()` already active** — Do NOT inject `ActivatedRoute`. The router automatically binds route params to `@Input()` properties with matching names. The `:id` param from the route maps directly to `@Input() id!: string`.

**Standalone component:** `standalone: true` explicit. No `@NgModule`. Imported directly by the router via `loadComponent`.

**Angular 17+ control flow:** Use `@if` / `@else if` / `@else` — never `*ngIf` / `*ngFor`. No `NgIf`/`NgFor` imports needed.

**Loading state pattern** (from architecture doc):
```typescript
isLoading = false;
// In service call:
this.isLoading = true;
service.call().subscribe({
  next: (data) => { this.data = data; this.isLoading = false; },
  error: () => { this.data = null; this.isLoading = false; }
});
```

**CSS custom properties:** All colors use `var(--color-*)` tokens from `styles.scss` (UX-DR1).

**No `window.history.back()`** — back navigation must use `[routerLink]="['/']"` (UX-DR13 explicit requirement).

**Responsive layout** — mobile-first, `min-width` media queries only (UX-DR9). Same pattern as `Home`'s `.catalog-container`.

### UX Specification — Book Detail Page (UX-DR2, UX-DR9, UX-DR13)

| Requirement | Implementation |
|-------------|----------------|
| Large cover (`size="large"`, 120×165px) | `<app-book-cover size="large">` |
| Body large curator note | `font-size: 16px; line-height: 1.6` on `.detail-note` |
| Back button `←` in nav area | `[routerLink]="['/']"` `mat-button` with `arrow_back` icon |
| Scroll restoration on back | Already handled by `withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })` in `app.config.ts` — no action needed in component |
| `BookCover` warm placeholder | `BookCover` handles null/broken `coverUrl` automatically — just pass `[coverUrl]="book.coverImageUrl"` |
| Responsive container | `padding: 0 16px` → 720px → 800px max-width via `min-width` media queries |
| No broken page on invalid id | `error` callback sets `book = null` → renders "Livre introuvable" with link back |

### Routing — How `/livres/:id` Is Already Wired

`app.routes.ts` contains:
```typescript
{
  path: 'livres/:id',
  loadComponent: () =>
    import('./features/catalog/book-detail/book-detail').then(m => m.BookDetail),
}
```

`catalog.routes.ts` also contains the same route. Both are already complete — **do not modify either file**.

### Key Integration — `BookService.getById()`

`book.service.ts` already implements:
```typescript
getById(id: number): Observable<Book> {
  return this.http.get<Book>(`${this.apiUrl}/${id}`);
}
```

The backend `GET /api/books/{id}` returns HTTP 404 with a `ProblemDetails` body for unknown IDs (Story 2.1). Angular's `HttpClient` converts 4xx/5xx into an `error` callback on the Observable subscription — the `error: () => { ... }` handler in `loadBook()` correctly catches this.

### Scope Guard — What NOT to Implement in This Story

| Feature | Story |
|---------|-------|
| `SelectionDuMoisCardComponent` | Story 2.5 |
| "Recently Added" homepage section | Story 2.5 |
| Footer freshness signal | Story 2.5 |
| `FilterBarComponent` | Story 3.2 |
| Admin edit button on detail page | N/A — admin edits via `/admin/livres/:id/modifier` (Story 5.3) |
| Backend API changes | N/A — `GET /api/books/{id}` already complete (Story 2.1) |
| `ActivatedRoute` injection | Not needed — `withComponentInputBinding()` handles param binding |

### Previous Story Intelligence (Story 2.3)

Learnings from Story 2.3 that directly apply:

1. **`provideRouter([])` required in tests** — `BookDetail` imports `RouterLink`, so the router must be provided. Omitting it causes `NullInjectorError: No provider for Router`.

2. **`provideAnimationsAsync()` required in tests** — `BookCover` uses `MatIconModule` animations.

3. **Test pattern: `fixture.componentRef.setInput('inputName', value)`** — mandatory for Angular 17+ standalone components with `@Input()`. Direct `component.id = '42'` bypasses Angular binding.

4. **Vitest `threads` pool** — `vitest.config.ts` + `angular.json` `runnerConfig: "vitest.config.ts"` must not be removed or modified.

5. **No `.component.ts` suffix** — class name is `BookDetail`, file is `book-detail.ts`. This project does NOT use the `*Component` naming convention from the architecture doc — the actual code uses the shorter form.

6. **`@if`/`@else if`/`@else` control flow** — Angular 17+ block syntax. No `NgIf`/`NgFor` imports needed.

7. **Service injection via constructor** (`private bookService: BookService`) — same pattern as `Home`.

### Git Intelligence

Recent commits show:
- `2c1ad1a` / `3e55da1` — Story 2.3 (`BookListItem` + `Home` catalog page)
- `84699dc` / `0a3966d` — Story 2.2 (`BookCover`)
- `6ca9180` — Story 2.1 (Public books API)

The frontend already has the complete shared component infrastructure (`BookCover`), the routing plumbing, and the service layer. This story is the simplest composition so far: one new component, one new spec file.

### References

- `BookDetail` stub: [frontend/src/app/features/catalog/book-detail/book-detail.ts](frontend/src/app/features/catalog/book-detail/book-detail.ts)
- `BookCover` (complete): [frontend/src/app/shared/components/book-cover/book-cover.ts](frontend/src/app/shared/components/book-cover/book-cover.ts)
- `Book` model: [frontend/src/app/shared/models/book.model.ts](frontend/src/app/shared/models/book.model.ts)
- `BookService.getById()`: [frontend/src/app/shared/services/book.service.ts](frontend/src/app/shared/services/book.service.ts)
- App routing: [frontend/src/app/app.routes.ts](frontend/src/app/app.routes.ts)
- Catalog routing: [frontend/src/app/features/catalog/catalog.routes.ts](frontend/src/app/features/catalog/catalog.routes.ts)
- App config (scroll restoration + `withComponentInputBinding`): [frontend/src/app/app.config.ts](frontend/src/app/app.config.ts)
- Vitest config: [frontend/vitest.config.ts](frontend/vitest.config.ts)
- UX spec — Book Detail: `_bmad-output/planning-artifacts/ux-design-specification.md` — UX-DR2, UX-DR9, UX-DR13
- Architecture — Frontend file structure: `_bmad-output/planning-artifacts/architecture.md` — Frontend file organization
- Previous story: `_bmad-output/implementation-artifacts/2-3-book-list-view-catalog-page-with-book-list-item-component.md`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List

**Files to modify:**
- `frontend/src/app/features/catalog/book-detail/book-detail.ts` — full implementation replacing stub

**New files:**
- `frontend/src/app/features/catalog/book-detail/book-detail.spec.ts` — tests for BookDetail

## Change Log

| Date | Change |
|------|--------|
| 2026-04-16 | Story created — BookDetail component implementation guide. |

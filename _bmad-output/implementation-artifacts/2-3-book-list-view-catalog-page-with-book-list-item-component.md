# Story 2.3: Book List View — Catalog Page with BookListItemComponent

Status: review

## Story

As an employee,
I want to see the full book catalog as a vertically scrollable list with covers and curator note previews,
So that I can browse what's available and decide what to read without visiting the library.

## Acceptance Criteria

1. **Given** the catalog has books, **when** a user opens `/`, **then** all books are displayed as a vertical list, each item showing: cover (left, 72×100px), title, author, genre, and a 2-line clamped curator note preview.

2. **Given** a book list item is displayed with no cover, **when** it renders, **then** the `BookCoverComponent` warm placeholder is shown (no broken icon).

3. **Given** the catalog is viewed on mobile (< 600px), **then** the layout uses 16px horizontal margins, single column; **given** viewed on tablet (600–960px), **then** max-width 720px centered; **given** viewed on desktop (> 960px), **then** max-width 800px centered.

4. **Given** the database has no books, **when** the catalog section renders, **then** "La médiathèque est vide pour l'instant." is displayed with no action link for public users.

5. **Given** each `BookListItemComponent`, **when** rendered, **then** it has `role="article"` and `aria-label="[Titre] par [Auteur]"`.

## Tasks / Subtasks

- [x] Task 1: Implement `BookListItem` component (AC: #1, #2, #5)
  - [x] Replace the stub in `frontend/src/app/shared/components/book-list-item/book-list-item.ts`
  - [x] Add `standalone: true`, `imports: [BookCover, RouterLink]` — keep class name `BookListItem` (not `BookListItemComponent`)
  - [x] `@Input() book!: Book` — import `Book` from `shared/models/book.model`
  - [x] `@Input() variant: 'default' | 'compact' = 'default'`
  - [x] Implement layout: cover (left, 72×100px) + right column (title, author/genre, note preview)
  - [x] `compact` variant omits curator note preview (used by admin Story 5.2)
  - [x] 2-line clamp on curator note preview via CSS: `-webkit-line-clamp: 2` + `overflow: hidden`
  - [x] Wrap entire item in a `[routerLink]` anchor to `/livres/:id`
  - [x] `role="article"` on root element, `aria-label="[book.title] par [book.author]"`
  - [x] Use only CSS custom properties from `styles.scss` for colors

- [x] Task 2: Implement `Home` component — catalog page (AC: #1, #3, #4)
  - [x] Replace the stub in `frontend/src/app/features/catalog/home/home.ts`
  - [x] Inject `BookService`; `books: Book[] = []`; `isLoading = false`
  - [x] `ngOnInit` calls `loadBooks()` using the Angular loading state pattern (architecture doc)
  - [x] Template: `@if (isLoading)` → `mat-progress-spinner`; `@for (book of books)` → `<app-book-list-item>`; empty state message
  - [x] Apply responsive `.catalog-container` class: mobile 16px margins → tablet max-width 720px centered → desktop max-width 800px centered
  - [x] Leave structural placeholders (HTML comments) for Story 2.5 sections: Sélection du mois (above list) and Recently Added (above catalog)
  - [x] Import `MatProgressSpinnerModule`, `BookListItem`, `RouterLink`

- [x] Task 3: Write tests for `BookListItem` (AC: #1, #2, #5)
  - [x] Create `frontend/src/app/shared/components/book-list-item/book-list-item.spec.ts`
  - [x] Test: renders title, author, genre from `book` input
  - [x] Test: shows `<app-book-cover>` element (delegate placeholder logic to BookCover — only test integration presence)
  - [x] Test: `role="article"` present on root element
  - [x] Test: `aria-label` contains book title and author
  - [x] Test: curator note preview shown in `default` variant
  - [x] Test: curator note NOT shown in `compact` variant

- [x] Task 4: Validation
  - [x] `ng build` — 0 errors, 0 warnings
  - [x] `ng test --watch=false` — all tests pass, 0 regressions (previous 8 BookCover + 3 App tests must still pass)

## Dev Notes

### Scope: Frontend only — two component files + one spec file

No backend changes. No routing changes (`app.routes.ts` already wires `/` to `Home`). No changes to `book.service.ts` — `getAll()` is already implemented.

### What Already Exists — DO NOT Recreate

| Artifact | Location | Status |
|----------|----------|--------|
| `BookListItem` stub | `frontend/src/app/shared/components/book-list-item/book-list-item.ts` | STUB — replace with full implementation |
| `Home` stub | `frontend/src/app/features/catalog/home/home.ts` | STUB — replace with catalog page |
| `BookCover` | `frontend/src/app/shared/components/book-cover/book-cover.ts` | COMPLETE — Story 2.2; class `BookCover`, selector `app-book-cover` |
| `Book` interface | `frontend/src/app/shared/models/book.model.ts` | COMPLETE — all FR34 fields including `coverImageUrl: string \| null` |
| `BookService.getAll()` | `frontend/src/app/shared/services/book.service.ts` | COMPLETE — returns `Observable<Book[]>` from `GET /api/books` |
| Global theme tokens | `frontend/src/styles.scss` | COMPLETE — all `--color-*` custom props |
| Angular Material M3 | `@angular/material` v21.2 | COMPLETE — `MatProgressSpinnerModule` available |
| `RouterLink` | `@angular/router` | COMPLETE — available as standalone import |
| Routing at `/` | `frontend/src/app/app.routes.ts` | COMPLETE — `''` path → `Home` (loadComponent) |
| Vitest threads config | `frontend/vitest.config.ts` + `angular.json` | COMPLETE — Story 2.2 fix; do NOT remove |

### Critical: Class Name and File Conventions

The project convention is **NO `.component.ts` suffix** — class names match file names without the suffix:
- Class name: **`BookListItem`** (NOT `BookListItemComponent`)
- File: `book-list-item.ts` (NOT `book-list-item.component.ts`)
- Class name: **`Home`** (NOT `HomeComponent`)
- File: `home.ts` (NOT `home.component.ts`)

No separate `.html` or `.scss` files — **inline template and styles** in the `.ts` file. This is the established project standard from Story 1.1 and Story 2.2.

### Task 1: Full `BookListItem` Implementation

**File:** `frontend/src/app/shared/components/book-list-item/book-list-item.ts`

```typescript
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BookCover } from '../book-cover/book-cover';
import { Book } from '../../models/book.model';

@Component({
  selector: 'app-book-list-item',
  standalone: true,
  imports: [BookCover, RouterLink],
  template: `
    <a class="book-list-item book-list-item--{{ variant }}"
       [routerLink]="['/livres', book.id]"
       [attr.aria-label]="book.title + ' par ' + book.author"
       role="article">
      <app-book-cover
        [coverUrl]="book.coverImageUrl"
        size="small"
        [alt]="'Couverture de ' + book.title">
      </app-book-cover>
      <div class="book-list-item__info">
        <h3 class="book-list-item__title">{{ book.title }}</h3>
        <p class="book-list-item__meta">{{ book.author }}<span *ngIf="book.genre"> · {{ book.genre }}</span></p>
        @if (variant === 'default' && book.curatorNote) {
          <p class="book-list-item__note">{{ book.curatorNote }}</p>
        }
      </div>
    </a>
  `,
  styles: [`
    .book-list-item {
      display: flex;
      flex-direction: row;
      gap: 12px;
      align-items: flex-start;
      padding: 12px 0;
      border-bottom: 1px solid var(--color-outline);
      text-decoration: none;
      color: inherit;
      cursor: pointer;
    }
    .book-list-item:hover { background-color: var(--color-primary-container); }
    .book-list-item:last-child { border-bottom: none; }

    .book-list-item__info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .book-list-item__title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      line-height: 1.4;
      color: var(--color-on-surface);
    }

    .book-list-item__meta {
      margin: 0;
      font-size: 14px;
      color: var(--color-on-surface-variant);
    }

    /* 2-line clamp — UX-DR4 */
    .book-list-item__note {
      margin: 0;
      font-size: 14px;
      font-style: italic;
      color: var(--color-on-surface-variant);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class BookListItem {
  @Input() book!: Book;
  @Input() variant: 'default' | 'compact' = 'default';
}
```

**Implementation notes:**
- `role="article"` is on the `<a>` root — semantically correct for a navigable article item.
- `[attr.aria-label]` is used (not plain `[aria-label]`) to ensure the attribute renders even on the `<a>` element.
- `size="small"` maps to `BookCover`'s `64×88px` — this is **not** the cover size specified in the AC. The AC requires 72×100px display size. The `small` size from `BookCover` is 64×88px — use CSS to override the displayed dimensions while keeping the `size` input at `"small"`. **Alternatively:** pass `size="medium"` (96×132px) and let CSS size it. The cleanest approach: pass `size="small"` for the near-correct dimensions, then override width/height in the containing styles or accept the slight difference. The `BookCover` sizes are `small: 64×88px`, `medium: 96×132px`. The design spec says 72×100px — this is between small and medium. Use `size="small"` to avoid an oversized cover, or add a CSS wrapper. **Decision:** use `size="small"` and accept 64×88px (nearest size) OR wrap in a div with `width: 72px; height: 100px` and `overflow: hidden`. The latter is architecturally cleaner — keep `BookCover` sizes canonical, constrain the display via wrapper CSS. See below for the wrapper approach.

**Refined cover size approach** (preserves `BookCover` canonical sizes while matching UX spec):

```html
<div class="book-list-item__cover-wrapper">
  <app-book-cover
    [coverUrl]="book.coverImageUrl"
    size="small"
    [alt]="'Couverture de ' + book.title">
  </app-book-cover>
</div>
```
```scss
.book-list-item__cover-wrapper {
  width: 72px;
  height: 100px;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 4px;
}
```

This applies 72×100px display size matching the UX spec without modifying `BookCover`'s size system. `BookCover` internal `small` (64×88px) will scale within the 72×100px wrapper since `book-cover--small` sets explicit pixel dimensions — the wrapper clips. However, this means covers appear clipped. Better: use `size="medium"` (96×132px) and CSS-constrain to 72×100px with `overflow: hidden`. This gives a larger source image scaled down. **Final decision:** use `size="medium"` in a 72×100px wrapper — `object-fit: cover` in `BookCover` ensures no distortion.

> Note to dev: The `app-book-cover` component has fixed pixel dimensions set by its internal CSS (`book-cover--small: 64×88px`, `book-cover--medium: 96×132px`). To achieve the UX-spec 72×100px, either: (a) use size `"small"` with a CSS transform or wrapper constraint, or (b) simply use `size="small"` and accept the 64×88px canonical size (close enough for this list view). The **simplest and most maintainable approach** is to use `size="small"` as-is — the 8px difference is imperceptible in a list context and avoids CSS hacks. Only override if explicitly required in review.

- The `*ngIf` in `<span *ngIf="book.genre">` requires either `NgIf` import or replacement with `@if`. Since Angular 17+ `@if` is preferred: use `@if (book.genre)` block inside template for genre display, or simply render `{{ book.author }} · {{ book.genre }}` and accept the `·` appearing even without genre. Best approach: `{{ book.author }}{{ book.genre ? ' · ' + book.genre : '' }}`.

### Task 2: Full `Home` Component Implementation

**File:** `frontend/src/app/features/catalog/home/home.ts`

```typescript
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BookListItem } from '../../../shared/components/book-list-item/book-list-item';
import { BookService } from '../../../shared/services/book.service';
import { Book } from '../../../shared/models/book.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [BookListItem, RouterLink, MatProgressSpinnerModule, MatToolbarModule],
  template: `
    <!-- Story 2.5: SelectionDuMoisCardComponent slot — add above catalog when implemented -->

    <!-- Story 2.5: Recently Added section slot — add above catalog when implemented -->

    <!-- Story 3.2: FilterBarComponent slot — add above catalog list when implemented -->

    <div class="catalog-container">
      @if (isLoading) {
        <div class="catalog-loading">
          <mat-progress-spinner mode="indeterminate" diameter="40"></mat-progress-spinner>
        </div>
      } @else if (books.length === 0) {
        <p class="catalog-empty">La médiathèque est vide pour l'instant.</p>
      } @else {
        <ul class="catalog-list" aria-label="Catalogue de livres">
          @for (book of books; track book.id) {
            <li class="catalog-list__item">
              <app-book-list-item [book]="book" variant="default"></app-book-list-item>
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: [`
    .catalog-container {
      padding: 0 16px;
      margin: 0 auto;
    }
    @media (min-width: 600px) {
      .catalog-container {
        padding: 0 24px;
        max-width: 720px;
      }
    }
    @media (min-width: 960px) {
      .catalog-container {
        max-width: 800px;
      }
    }

    .catalog-loading {
      display: flex;
      justify-content: center;
      padding: 48px 0;
    }

    .catalog-empty {
      padding: 48px 0;
      text-align: center;
      color: var(--color-on-surface-variant);
      font-size: 16px;
    }

    .catalog-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .catalog-list__item {
      display: block;
    }
  `]
})
export class Home implements OnInit {
  books: Book[] = [];
  isLoading = false;

  constructor(private bookService: BookService) {}

  ngOnInit(): void {
    this.loadBooks();
  }

  private loadBooks(): void {
    this.isLoading = true;
    this.bookService.getAll().subscribe({
      next: (books) => {
        this.books = books;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
```

**Implementation notes:**
- Wrap `BookListItem` items in `<ul>`/`<li>` for semantic HTML — the list structure is semantically correct for a catalog list even though `BookListItem` carries `role="article"`.
- `@for ... track book.id` is the Angular 17+ `@for` with mandatory `track` expression — do NOT use `*ngFor`.
- The `MatToolbarModule` import is not strictly needed in this story (toolbar belongs to `App` or `AppShell`). Only import what the template actually uses — remove if toolbar is in a parent component.
- The three HTML comments mark exact insertion points for Stories 2.5 and 3.2 — keep them.

### Task 3: Test Implementation

**File:** `frontend/src/app/shared/components/book-list-item/book-list-item.spec.ts`

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { BookListItem } from './book-list-item';
import { Book } from '../../models/book.model';

const mockBook: Book = {
  id: 1,
  isbn: '9782070541270',
  title: 'An Elegant Puzzle',
  author: 'Will Larson',
  genre: 'Management',
  publicationYear: 2019,
  coverImageUrl: 'https://covers.openlibrary.org/b/isbn/9782070541270-M.jpg',
  curatorNote: 'Incontournable pour les tech leads. Une réflexion sur le management en ingénierie.',
  dateAdded: '2026-04-01T00:00:00Z',
  isSelectionDuMois: false,
  status: 'available',
};

describe('BookListItem', () => {
  let fixture: ComponentFixture<BookListItem>;
  let component: BookListItem;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookListItem],
      providers: [
        provideAnimationsAsync(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BookListItem);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('book', mockBook);
    fixture.detectChanges();
  });

  it('should render book title (AC #1)', () => {
    const title = fixture.nativeElement.querySelector('.book-list-item__title');
    expect(title?.textContent).toContain('An Elegant Puzzle');
  });

  it('should render author and genre (AC #1)', () => {
    const meta = fixture.nativeElement.querySelector('.book-list-item__meta');
    expect(meta?.textContent).toContain('Will Larson');
    expect(meta?.textContent).toContain('Management');
  });

  it('should include app-book-cover element (AC #2)', () => {
    const bookCover = fixture.nativeElement.querySelector('app-book-cover');
    expect(bookCover).toBeTruthy();
  });

  it('should have role="article" on root element (AC #5)', () => {
    const root = fixture.nativeElement.querySelector('[role="article"]');
    expect(root).toBeTruthy();
  });

  it('should set aria-label with title and author (AC #5)', () => {
    const root = fixture.nativeElement.querySelector('[role="article"]');
    const label = root?.getAttribute('aria-label');
    expect(label).toContain('An Elegant Puzzle');
    expect(label).toContain('Will Larson');
  });

  it('should show curator note preview in default variant (AC #1)', () => {
    // default variant is already set by beforeEach
    const note = fixture.nativeElement.querySelector('.book-list-item__note');
    expect(note).toBeTruthy();
    expect(note?.textContent).toContain('Incontournable');
  });

  it('should NOT show curator note in compact variant (admin use)', () => {
    fixture.componentRef.setInput('variant', 'compact');
    fixture.detectChanges();
    const note = fixture.nativeElement.querySelector('.book-list-item__note');
    expect(note).toBeNull();
  });
});
```

**Testing notes:**
- `provideRouter([])` is required because `BookListItem` imports `RouterLink`. Omitting it causes a `NullInjectorError`.
- `provideAnimationsAsync()` is required because `BookCover` (imported by `BookListItem`) uses `MatIconModule` animations.
- Use `fixture.componentRef.setInput('book', mockBook)` for Angular 17+ input assignment — **never** `component.book = mockBook` directly for tested inputs.
- The spec covers 7 tests. Prior test count before this story: 8 (BookCover) + 3 (App) = 11 total. After: 18+ total — all must pass.
- `BookListItem` imports `BookCover` — the complete `BookCover` implementation (Story 2.2) is already in place, so no stub issues.

### Architecture Compliance

**Standalone component:** `standalone: true` is explicit. No `@NgModule`. `BookListItem` is imported directly by consuming components (`Home`, admin `book-list.ts` in Story 5.2).

**Angular 17+ control flow:** Use `@if` / `@for` / `@else` — never `*ngIf` / `*ngFor`. No `NgIf`/`NgFor` imports needed.

**CSS custom properties:** All colors use `var(--color-*)` tokens from `styles.scss` (UX-DR1).

**Inline styles/template:** No separate `.html` or `.scss` files — project convention established Story 1.1.

**Loading state pattern** (from architecture doc):
```typescript
isLoading = false;
// In service call:
this.isLoading = true;
service.call().subscribe({
  next: (data) => { this.data = data; this.isLoading = false; },
  error: () => { this.isLoading = false; }
});
```

**No NgRx / no state management library** — component-level state only (confirmed in architecture).

**API URL:** `BookService` uses `environment.apiUrl` — never hardcode.

**NFR3 compliance:** `BookCover` uses direct `img src` to Open Library CDN — `BookListItem` must pass `coverImageUrl` directly without modification.

### Responsive Layout Specification

From UX-DR9 — mobile-first, `min-width` media queries only:

| Breakpoint | Margins | Max-width | Centering |
|------------|---------|-----------|-----------|
| < 600px (mobile) | 16px horizontal | none | none |
| ≥ 600px (tablet) | 24px horizontal | 720px | `margin: 0 auto` |
| ≥ 960px (desktop) | 24px horizontal | 800px | `margin: 0 auto` |

This applies to the `.catalog-container` wrapper in `Home`. **Single column on all breakpoints** — no grid, no flex-row wrap.

### Scope Guard — What NOT to Implement in This Story

| Feature | Story |
|---------|-------|
| `SelectionDuMoisCardComponent` | Story 2.5 |
| "Recently Added" section on homepage | Story 2.5 |
| Footer "X livres · Mis à jour le [date]" | Story 2.5 |
| `FilterBarComponent` | Story 3.2 |
| Book detail page (`/livres/:id`) | Story 2.4 |
| Admin `compact` variant wire-up | Story 5.2 (component already supports it via `@Input variant`) |
| Any backend endpoint changes | N/A — `GET /api/books` already implemented (Story 2.1) |
| App bar modifications | Out of scope — already exists from Story 1.1 |

### Key Integration Point — BookCover in BookListItem

`BookCover` (Story 2.2) selector is `app-book-cover`. Consumer contract from Story 2.2 dev notes:

```html
<!-- In BookListItem template — Story 2.3 usage -->
<app-book-cover
  [coverUrl]="book.coverImageUrl"
  size="small"
  [alt]="'Couverture de ' + book.title">
</app-book-cover>
```

The `BookCover` component handles:
- Skeleton shimmer while loading
- Warm grey placeholder (`#E8E3DD`) for null or broken URL
- Never a broken image icon

**Do NOT add any cover fallback logic in `BookListItem`** — `BookCover` handles all cover states already.

### Previous Story Intelligence (Story 2.2)

Key learnings from Story 2.2 that apply directly:

1. **`NG0100 ExpressionChangedAfterItHasBeenCheckedError`** — was caused by `ngOnChanges` mutating state mid-change-detection. Use `@Input` setter instead of `ngOnChanges` if reactive state resets are needed. For `BookListItem`, no reactive state resets required — `book` is bound once per list item.

2. **Vitest `threads` pool** — `vitest.config.ts` + `angular.json` `runnerConfig: "vitest.config.ts"` already configured from Story 2.2. **Do NOT remove or modify these files.**

3. **Test pattern** — `fixture.componentRef.setInput('inputName', value)` is mandatory for Angular 17+ standalone component inputs in tests. Direct assignment `component.input = value` bypasses Angular's input binding mechanism.

4. **`provideAnimationsAsync()` required** — any component importing Angular Material modules needs this in test providers. `BookListItem` imports `BookCover` which imports `MatIconModule`, so this applies.

5. **`provideRouter([])` required** — any component importing `RouterLink` needs router provided in tests. **This is new for Story 2.3** — Story 2.2 did not use RouterLink. Failing to provide the router causes `NullInjectorError: No provider for Router`.

### Git Intelligence

Recent commits show Story 2.2 was the last completed story. Prior to it: Story 1.4, 1.3, 1.2, 1.1 — infrastructure and scaffolding. The frontend stub structure was established in Story 1.1. Story 2.1 implemented the backend API. Story 2.2 implemented `BookCover`. This story (`2.3`) is the first story that assembles a complete page view with component composition and real API calls.

### References

- `BookListItem` stub: [frontend/src/app/shared/components/book-list-item/book-list-item.ts](frontend/src/app/shared/components/book-list-item/book-list-item.ts)
- `Home` stub: [frontend/src/app/features/catalog/home/home.ts](frontend/src/app/features/catalog/home/home.ts)
- `BookCover` (complete): [frontend/src/app/shared/components/book-cover/book-cover.ts](frontend/src/app/shared/components/book-cover/book-cover.ts)
- `Book` model: [frontend/src/app/shared/models/book.model.ts](frontend/src/app/shared/models/book.model.ts)
- `BookService`: [frontend/src/app/shared/services/book.service.ts](frontend/src/app/shared/services/book.service.ts)
- App routing: [frontend/src/app/app.routes.ts](frontend/src/app/app.routes.ts)
- App config (scroll restoration): [frontend/src/app/app.config.ts](frontend/src/app/app.config.ts)
- Vitest config: [frontend/vitest.config.ts](frontend/vitest.config.ts)
- UX spec — BookListItemComponent: `_bmad-output/planning-artifacts/ux-design-specification.md` — Custom Components section, UX-DR4
- UX spec — Responsive: `_bmad-output/planning-artifacts/ux-design-specification.md` — Breakpoint Strategy section, UX-DR9
- Architecture — Frontend structure: `_bmad-output/planning-artifacts/architecture.md` — Frontend file organization

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

No issues encountered during implementation. Build and tests passed first time.

### Completion Notes List

- Implemented `BookListItem` standalone component with inline template/styles following project convention (no separate .html/.scss files).
- Used `size="medium"` + 72×100px CSS wrapper to match UX-DR4 display spec without modifying `BookCover`'s canonical size system.
- Used Angular 17+ `@if`/`@for` control flow throughout; no `NgIf`/`NgFor` needed.
- Genre rendered inline via template expression `{{ book.author }}{{ book.genre ? ' · ' + book.genre : '' }}` — avoids `*ngIf` on span.
- `compact` variant suppresses curator note preview; `default` shows 2-line clamped note via `-webkit-line-clamp`.
- `role="article"` and `[attr.aria-label]` placed on the `<a>` root element (AC #5).
- `Home` component: loading state pattern with `isLoading` flag, `@if`/`@else if`/`@else` branches, responsive `.catalog-container`, empty state message (AC #4), structural HTML comment placeholders for Stories 2.5 and 3.2.
- Created 7 unit tests in `book-list-item.spec.ts`: title, author/genre, app-book-cover presence, role="article", aria-label, default note display, compact note suppression.
- `ng build` — 0 errors, 0 warnings. `ng test --watch=false` — 15 tests passed across 3 files, 0 regressions.

## File List

**Modified files:**
- `frontend/src/app/shared/components/book-list-item/book-list-item.ts` — full implementation replacing stub
- `frontend/src/app/features/catalog/home/home.ts` — catalog page implementation replacing stub

**New files:**
- `frontend/src/app/shared/components/book-list-item/book-list-item.spec.ts` — 7 tests for BookListItem

## Change Log

| Date | Change |
|------|--------|
| 2026-04-16 | Story created — BookListItem + Home catalog page implementation plan documented. |
| 2026-04-16 | Story implemented — BookListItem component, Home catalog page, 7 unit tests. Build clean, 15 tests passed. Status → review. |

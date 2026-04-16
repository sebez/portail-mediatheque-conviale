# Story 2.5: Homepage — Sélection du Mois Feature Card, Recently Added & Footer

Status: ready-for-dev

## Story

As an employee,
I want the homepage to prominently display the "Sélection du mois" editorial pick and the most recently added books,
so that every visit shows me what the curator recommends and what's new.

## Acceptance Criteria

1. **Given** at least one book has `isSelectionDuMois = true`, **when** the homepage loads, **then** `SelectionDuMoisCard` is rendered at the top with: a terracotta "Sélection du mois" badge pill, a month label ("Avril 2026" format), cover at 120×165px, title, author, full curator note in Body large italic, and a "Voir le livre →" ghost link.

2. **Given** no book has `isSelectionDuMois = true`, **when** the homepage loads, **then** the Sélection du mois section is entirely absent from the DOM.

3. **Given** multiple books are featured, **when** viewed on mobile, **then** they display in a horizontal scroll snap container; on desktop in a 2-column grid.

4. **Given** books with recent `dateAdded` values exist, **when** the "Recently Added" section renders, **then** the 5 most recently added books are shown sorted by `dateAdded DESC` using `BookListItemComponent`.

5. **Given** the footer area, **when** the homepage renders, **then** "X livres dans la collection · Mis à jour le [date]" is displayed, dynamically populated from the API response.

## Tasks / Subtasks

- [ ] Task 1: Implement `SelectionDuMoisCard` component (AC: #1, #2, #3)
  - [ ] Replace stub in `frontend/src/app/shared/components/selection-du-mois-card/selection-du-mois-card.ts`
  - [ ] `standalone: true`; inline template and styles (NO separate .html/.scss files)
  - [ ] `@Input() books: Book[] = []`; typed to `Book[]` (NOT `unknown[]` as in stub)
  - [ ] Render nothing when `books.length === 0` — use `@if (books.length > 0)` as outermost wrapper
  - [ ] Outer section: `role="region"` + `aria-label="Sélection du mois"`
  - [ ] Badge pill: `<span class="sdm-badge">Sélection du mois</span>` — terracotta background (`var(--color-primary)`)
  - [ ] Month label: computed property `get currentMonthLabel()` returning French month + year (e.g., "Avril 2026")
  - [ ] For each book: `app-book-cover size="large"` + title (Title large) + author (Body medium muted) + full curator note (Body large italic) + "Voir le livre →" `[routerLink]`
  - [ ] Multiple books layout: `scroll-snap-type: x mandatory; overflow-x: auto` on mobile; `grid-template-columns: repeat(2, 1fr)` on desktop (≥960px)
  - [ ] Single book layout: full-width centered card (no scroll, no grid)
  - [ ] All colors via `var(--color-*)` custom properties

- [ ] Task 2: Write tests for `SelectionDuMoisCard` (AC: #1, #2, #3)
  - [ ] Create `frontend/src/app/shared/components/selection-du-mois-card/selection-du-mois-card.spec.ts`
  - [ ] Test: renders nothing when `books` is empty (`[]`) — section absent from DOM
  - [ ] Test: renders `role="region"` section when books present
  - [ ] Test: shows "Sélection du mois" badge text
  - [ ] Test: shows month label (non-empty string in correct format)
  - [ ] Test: shows `app-book-cover` with `size="large"` for each book
  - [ ] Test: shows book title and author
  - [ ] Test: shows full curator note (not clamped)
  - [ ] Test: "Voir le livre →" link has `routerLink` to `/livres/:id`

- [ ] Task 3: Update `Home` component (AC: #4, #5)
  - [ ] Update `frontend/src/app/features/catalog/home/home.ts`
  - [ ] Import and add `SelectionDuMoisCard` to `imports` array
  - [ ] Add `selectionBooks: Book[]` and `recentlyAdded: Book[]` properties
  - [ ] Derive `selectionBooks` and `recentlyAdded` from already-loaded `books` array (NO extra API calls):
    - `selectionBooks = books.filter(b => b.isSelectionDuMois)`
    - `recentlyAdded = [...books].sort((a, b) => b.dateAdded.localeCompare(a.dateAdded)).slice(0, 5)`
  - [ ] Replace slot comment for SelectionDuMois with `<app-selection-du-mois-card [books]="selectionBooks">`
  - [ ] Replace slot comment for Recently Added with a proper section: `<section class="recently-added">`, heading "Nouveaux arrivages", `<ul>` of `BookListItem` with `variant="default"`
  - [ ] Add footer: `<footer class="catalog-footer">X livres dans la collection · Mis à jour le [date]</footer>`
  - [ ] Footer date: most recent `dateAdded` from the books array, formatted in French ("15 avril 2026")
  - [ ] Footer only renders when `books.length > 0`; recently added section only renders when books exist
  - [ ] Keep existing catalog list, loading spinner, and empty state — NO regressions

- [ ] Task 4: Write tests for `Home` (AC: #4, #5 + regression for #1, #2)
  - [ ] Create `frontend/src/app/features/catalog/home/home.spec.ts`
  - [ ] Mock `BookService.getAll()` with Vitest `vi.fn()`
  - [ ] Test: `SelectionDuMoisCard` is NOT in DOM when no selection books exist
  - [ ] Test: `SelectionDuMoisCard` IS in DOM when `isSelectionDuMois = true` books present
  - [ ] Test: Recently Added section shows (up to) 5 most recent books by `dateAdded DESC`
  - [ ] Test: footer text contains "livres dans la collection" when books exist
  - [ ] Test: existing catalog list still renders all books (regression)
  - [ ] Test: empty state renders "La médiathèque est vide pour l'instant." when no books

- [ ] Task 5: Validation
  - [ ] `ng build` — 0 errors, 0 warnings
  - [ ] `ng test --watch=false` — all tests pass, 0 regressions (24 prior + ~14 new ≈ 38 total)

## Dev Notes

### Scope: Frontend only — two component files + two spec files

No backend changes. No routing changes — `/` is already wired to `Home`. No changes to `BookService` — derive selection and recently-added data client-side from the existing `getAll()` response.

### What Already Exists — DO NOT Recreate

| Artifact | Location | Status |
|----------|----------|--------|
| `SelectionDuMoisCard` stub | `frontend/src/app/shared/components/selection-du-mois-card/selection-du-mois-card.ts` | STUB — replace with full implementation |
| `Home` component | `frontend/src/app/features/catalog/home/home.ts` | COMPLETE (story 2.3) — update, do NOT recreate |
| Route `/` | `frontend/src/app/app.routes.ts` | COMPLETE — routes to `Home` |
| `BookCover` | `frontend/src/app/shared/components/book-cover/book-cover.ts` | COMPLETE — class `BookCover`, selector `app-book-cover`, `size="large"` = 120×165px |
| `BookListItem` | `frontend/src/app/shared/components/book-list-item/book-list-item.ts` | COMPLETE — `variant="default"` for catalog with note preview |
| `BookService.getAll()` | `frontend/src/app/shared/services/book.service.ts` | COMPLETE — `getAll(): Observable<Book[]>` |
| `Book` interface | `frontend/src/app/shared/models/book.model.ts` | COMPLETE — all FR34 fields including `isSelectionDuMois` and `dateAdded` |
| Global CSS tokens | `frontend/src/styles.scss` | COMPLETE — all `--color-*` properties |
| `withComponentInputBinding()` | `frontend/src/app/app.config.ts` | COMPLETE |
| `scrollPositionRestoration` | `frontend/src/app/app.config.ts` | COMPLETE |
| Vitest threads config | `frontend/vitest.config.ts` + `angular.json` | COMPLETE — Story 2.2 fix; do NOT remove |
| Angular Material v21.2 | `@angular/material` | COMPLETE — all Material modules available |

### Critical: Class Name and File Conventions

**NO `.component.ts` suffix** — this project's convention:
- Class name: **`SelectionDuMoisCard`** (NOT `SelectionDuMoisCardComponent`)
- File: `selection-du-mois-card.ts` (NOT `selection-du-mois-card.component.ts`)

Confirmed in: `book-cover.ts` → class `BookCover`, `book-list-item.ts` → class `BookListItem`, `book-detail.ts` → class `BookDetail`.

**Architecture doc names it `SelectionDuMoisCardComponent` — ignore this; actual code uses the shorter form.**

No separate `.html` or `.scss` files — **inline template and styles** in the `.ts` file.

### Task 1: Full `SelectionDuMoisCard` Implementation

**File:** `frontend/src/app/shared/components/selection-du-mois-card/selection-du-mois-card.ts`

```typescript
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BookCover } from '../book-cover/book-cover';
import { Book } from '../../models/book.model';

@Component({
  selector: 'app-selection-du-mois-card',
  standalone: true,
  imports: [BookCover, RouterLink],
  template: `
    @if (books.length > 0) {
      <section class="sdm-section" role="region" aria-label="Sélection du mois">
        <div class="sdm-header">
          <span class="sdm-badge">Sélection du mois</span>
          <span class="sdm-month">{{ currentMonthLabel }}</span>
        </div>
        <div class="sdm-cards" [class.sdm-cards--multiple]="books.length > 1">
          @for (book of books; track book.id) {
            <article class="sdm-card">
              <div class="sdm-card__cover">
                <app-book-cover
                  [coverUrl]="book.coverImageUrl"
                  size="large"
                  [alt]="'Couverture de ' + book.title">
                </app-book-cover>
              </div>
              <div class="sdm-card__content">
                <h2 class="sdm-card__title">{{ book.title }}</h2>
                <p class="sdm-card__author">{{ book.author }}</p>
                @if (book.curatorNote) {
                  <p class="sdm-card__note">{{ book.curatorNote }}</p>
                }
                <a [routerLink]="['/livres', book.id]" class="sdm-card__link">
                  Voir le livre →
                </a>
              </div>
            </article>
          }
        </div>
      </section>
    }
  `,
  styles: [`
    .sdm-section {
      padding: 0 16px 24px;
      margin: 0 auto;
    }
    @media (min-width: 600px) {
      .sdm-section { padding: 0 24px 24px; max-width: 720px; }
    }
    @media (min-width: 960px) {
      .sdm-section { max-width: 800px; }
    }

    /* Header row */
    .sdm-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    /* Badge pill — terracotta (UX-DR5) */
    .sdm-badge {
      display: inline-block;
      padding: 4px 12px;
      background-color: var(--color-primary);
      color: #ffffff;
      border-radius: 16px;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.02em;
    }

    /* Month label */
    .sdm-month {
      font-size: 14px;
      color: var(--color-on-surface-variant);
    }

    /* Cards container — single book: full width; multiple: horizontal scroll on mobile */
    .sdm-cards {
      display: flex;
      gap: 16px;
    }

    /* Multiple books: horizontal scroll snap on mobile (UX-DR5) */
    .sdm-cards--multiple {
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
      padding-bottom: 8px; /* space for scroll bar */
    }
    .sdm-cards--multiple .sdm-card {
      scroll-snap-align: start;
      flex: 0 0 calc(100% - 32px); /* near-full width on mobile */
    }

    /* 2-col grid on desktop for multiple books (UX-DR5) */
    @media (min-width: 960px) {
      .sdm-cards--multiple {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        overflow-x: unset;
        scroll-snap-type: unset;
      }
      .sdm-cards--multiple .sdm-card {
        flex: unset;
      }
    }

    /* Individual card */
    .sdm-card {
      background: var(--color-surface);
      border: 1px solid var(--color-outline);
      border-radius: 8px;
      padding: 16px;
      display: flex;
      gap: 16px;
      flex: 1; /* single book: fills full width */
    }

    .sdm-card__cover {
      flex-shrink: 0;
    }

    .sdm-card__content {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1;
      min-width: 0; /* prevent overflow */
    }

    /* Title — Title large (UX-DR5, UX typography scale: 20px/600) */
    .sdm-card__title {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      line-height: 1.3;
      color: var(--color-on-surface);
    }

    /* Author — Body medium muted */
    .sdm-card__author {
      margin: 0;
      font-size: 14px;
      color: var(--color-on-surface-variant);
    }

    /* Curator note — Body large italic (UX-DR5: "full curator note in Body large italic") */
    .sdm-card__note {
      margin: 0;
      font-size: 16px;
      font-weight: 400;
      line-height: 1.6;
      font-style: italic;
      color: var(--color-on-surface);
    }

    /* "Voir le livre →" ghost link (UX-DR16: ghost = mat-button text, terracotta) */
    .sdm-card__link {
      display: inline-block;
      margin-top: auto;
      color: var(--color-primary);
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
    }
    .sdm-card__link:hover {
      text-decoration: underline;
    }
  `]
})
export class SelectionDuMoisCard {
  @Input() books: Book[] = [];

  /** French month + year label, e.g., "Avril 2026" */
  get currentMonthLabel(): string {
    const now = new Date();
    const label = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(now);
    return label.charAt(0).toUpperCase() + label.slice(1); // "avril 2026" → "Avril 2026"
  }
}
```

**Implementation notes:**
- `@if (books.length > 0)` as outermost wrapper — entire section absent from DOM when no books (AC #2, UX-DR5).
- `currentMonthLabel` uses `Intl.DateTimeFormat` with `fr-FR` locale — produces "Avril 2026" automatically. First character capitalized manually because `Intl` returns lowercase month in French.
- `books.length > 1` drives the `.sdm-cards--multiple` modifier class that activates scroll snap on mobile and grid on desktop.
- `@for (book of books; track book.id)` — Angular 17+ control flow, no `NgFor` import needed.
- `[routerLink]="['/livres', book.id]"` — typed route array, same pattern as `Home` and `BookDetail`.

### Task 3: Updated `Home` Component

**File:** `frontend/src/app/features/catalog/home/home.ts`

```typescript
import { Component, OnInit } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BookListItem } from '../../../shared/components/book-list-item/book-list-item';
import { SelectionDuMoisCard } from '../../../shared/components/selection-du-mois-card/selection-du-mois-card';
import { BookService } from '../../../shared/services/book.service';
import { Book } from '../../../shared/models/book.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [BookListItem, SelectionDuMoisCard, MatProgressSpinnerModule],
  template: `
    <div class="catalog-container">
      @if (isLoading) {
        <div class="catalog-loading">
          <mat-progress-spinner mode="indeterminate" diameter="40"></mat-progress-spinner>
        </div>
      } @else if (books.length === 0) {
        <p class="catalog-empty">La médiathèque est vide pour l'instant.</p>
      } @else {
        <!-- SelectionDuMois section — handles its own absence when empty (UX-DR8) -->
        <app-selection-du-mois-card [books]="selectionBooks"></app-selection-du-mois-card>

        <!-- Recently Added section (UX-DR8, FR13: dateAdded DESC, top 5) -->
        <section class="recently-added" aria-label="Nouveaux arrivages">
          <h2 class="section-heading">Nouveaux arrivages</h2>
          <ul class="catalog-list" aria-label="Livres récents">
            @for (book of recentlyAdded; track book.id) {
              <li class="catalog-list__item">
                <app-book-list-item [book]="book" variant="default"></app-book-list-item>
              </li>
            }
          </ul>
        </section>

        <!-- Full catalog list (Story 2.3 — unchanged) -->
        <!-- Story 3.2: FilterBarComponent slot — add above catalog list when implemented -->
        <section aria-label="Catalogue complet">
          <h2 class="section-heading">Tout le catalogue</h2>
          <ul class="catalog-list" aria-label="Catalogue de livres">
            @for (book of books; track book.id) {
              <li class="catalog-list__item">
                <app-book-list-item [book]="book" variant="default"></app-book-list-item>
              </li>
            }
          </ul>
        </section>

        <!-- Footer freshness signal (UX-DR14, FR13/FR14) -->
        <footer class="catalog-footer">
          {{ books.length }} livres dans la collection · Mis à jour le {{ lastUpdatedLabel }}
        </footer>
      }
    </div>
  `,
  styles: [`
    .catalog-container {
      padding: 0 16px;
      margin: 0 auto;
    }
    @media (min-width: 600px) {
      .catalog-container { padding: 0 24px; max-width: 720px; }
    }
    @media (min-width: 960px) {
      .catalog-container { max-width: 800px; }
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

    /* Section headings */
    .section-heading {
      margin: 24px 0 12px;
      font-size: 18px;
      font-weight: 600;
      color: var(--color-on-surface);
      border-bottom: 1px solid var(--color-outline);
      padding-bottom: 8px;
    }

    .catalog-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .catalog-list__item {
      display: block;
    }

    /* Footer freshness signal (UX-DR14, Label typography: 12px/500) */
    .catalog-footer {
      margin-top: 32px;
      padding: 16px 0;
      border-top: 1px solid var(--color-outline);
      font-size: 12px;
      font-weight: 500;
      color: var(--color-on-surface-variant);
      text-align: center;
    }
  `]
})
export class Home implements OnInit {
  books: Book[] = [];
  selectionBooks: Book[] = [];
  recentlyAdded: Book[] = [];
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
        this.selectionBooks = books.filter(b => b.isSelectionDuMois);
        // Sort by dateAdded DESC (ISO 8601 strings sort lexicographically, same as chronologically)
        this.recentlyAdded = [...books]
          .sort((a, b) => b.dateAdded.localeCompare(a.dateAdded))
          .slice(0, 5);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  /** Most recent dateAdded formatted in French: "15 avril 2026" */
  get lastUpdatedLabel(): string {
    if (this.books.length === 0) return '';
    const latest = this.recentlyAdded[0]?.dateAdded ?? this.books[0]?.dateAdded;
    if (!latest) return '';
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(latest));
  }
}
```

**Key design decisions:**
- **One API call** — derive `selectionBooks` and `recentlyAdded` from the already-loaded `books` array. No extra HTTP requests for a 60-book dataset.
- **`SelectionDuMoisCard` manages its own empty state** — `Home` always renders `<app-selection-du-mois-card [books]="selectionBooks">`, but the component renders nothing when `selectionBooks.length === 0` (UX-DR5: "section absent from DOM if no books featured").
- **`lastUpdatedLabel` computed property** — uses the most recent dateAdded in the `recentlyAdded` array (the first element after DESC sort). Formatted in French with `Intl.DateTimeFormat('fr-FR')`.
- **ISO 8601 date string comparison** — `localeCompare()` on ISO 8601 strings ("2026-04-15T00:00:00Z") is equivalent to chronological comparison because ISO 8601 is lexicographically ordered. No need for `new Date()` conversion in the sort comparator.
- **Two sections + footer** — only shown when `books.length > 0`. The `@else if (books.length === 0)` branch handles the empty state without any sections.

### Task 2: `SelectionDuMoisCard` Tests

**File:** `frontend/src/app/shared/components/selection-du-mois-card/selection-du-mois-card.spec.ts`

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { SelectionDuMoisCard } from './selection-du-mois-card';
import { Book } from '../../models/book.model';

const makeBook = (overrides: Partial<Book> = {}): Book => ({
  id: 1,
  isbn: '9780306406157',
  title: 'An Elegant Puzzle',
  author: 'Will Larson',
  genre: 'Management',
  publicationYear: 2019,
  coverImageUrl: null,
  curatorNote: 'Un essai incontournable pour les tech leads.',
  dateAdded: '2026-04-01T00:00:00Z',
  isSelectionDuMois: true,
  status: 'available',
  ...overrides,
});

describe('SelectionDuMoisCard', () => {
  let fixture: ComponentFixture<SelectionDuMoisCard>;
  let component: SelectionDuMoisCard;

  async function create(books: Book[]) {
    await TestBed.configureTestingModule({
      imports: [SelectionDuMoisCard],
      providers: [provideAnimationsAsync(), provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(SelectionDuMoisCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('books', books);
    fixture.detectChanges();
  }

  it('renders nothing when books is empty (AC #2)', async () => {
    await create([]);
    const section = fixture.nativeElement.querySelector('[role="region"]');
    expect(section).toBeNull();
  });

  it('renders role="region" section when books present (AC #1)', async () => {
    await create([makeBook()]);
    const section = fixture.nativeElement.querySelector('[role="region"]');
    expect(section).toBeTruthy();
  });

  it('shows "Sélection du mois" badge (AC #1)', async () => {
    await create([makeBook()]);
    const badge = fixture.nativeElement.querySelector('.sdm-badge');
    expect(badge?.textContent?.trim()).toBe('Sélection du mois');
  });

  it('shows non-empty month label (AC #1)', async () => {
    await create([makeBook()]);
    const monthLabel = fixture.nativeElement.querySelector('.sdm-month');
    expect(monthLabel?.textContent?.trim()).toBeTruthy();
    expect(monthLabel?.textContent?.trim()).toMatch(/\d{4}/); // contains year
  });

  it('shows app-book-cover with size="large" (AC #1)', async () => {
    await create([makeBook()]);
    const coverEl = fixture.debugElement.query(sel => sel.name === 'app-book-cover');
    expect(coverEl).toBeTruthy();
    expect(coverEl?.componentInstance?.size).toBe('large');
  });

  it('shows book title (AC #1)', async () => {
    await create([makeBook()]);
    const title = fixture.nativeElement.querySelector('.sdm-card__title');
    expect(title?.textContent).toContain('An Elegant Puzzle');
  });

  it('shows book author (AC #1)', async () => {
    await create([makeBook()]);
    const author = fixture.nativeElement.querySelector('.sdm-card__author');
    expect(author?.textContent).toContain('Will Larson');
  });

  it('shows full curator note (AC #1)', async () => {
    await create([makeBook()]);
    const note = fixture.nativeElement.querySelector('.sdm-card__note');
    expect(note?.textContent).toContain('Un essai incontournable');
  });

  it('"Voir le livre →" link routes to /livres/:id (AC #1)', async () => {
    await create([makeBook({ id: 42 })]);
    const link = fixture.nativeElement.querySelector('.sdm-card__link');
    expect(link).toBeTruthy();
    // RouterLink with ['/livres', 42] produces href="/livres/42" after router setup
    expect(link?.getAttribute('href')).toContain('/livres/42');
  });

  it('renders multiple articles for multiple books (AC #3)', async () => {
    await create([makeBook({ id: 1 }), makeBook({ id: 2, title: 'Deep Work' })]);
    const cards = fixture.nativeElement.querySelectorAll('.sdm-card');
    expect(cards.length).toBe(2);
  });

  it('adds --multiple modifier class for multiple books (AC #3)', async () => {
    await create([makeBook({ id: 1 }), makeBook({ id: 2 })]);
    const container = fixture.nativeElement.querySelector('.sdm-cards--multiple');
    expect(container).toBeTruthy();
  });
});
```

### Task 4: `Home` Component Tests

**File:** `frontend/src/app/features/catalog/home/home.spec.ts`

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { Home } from './home';
import { BookService } from '../../../shared/services/book.service';
import { Book } from '../../../shared/models/book.model';

const makeBook = (id: number, dateAdded: string, isSelectionDuMois = false): Book => ({
  id,
  isbn: `978000000000${id}`,
  title: `Book ${id}`,
  author: `Author ${id}`,
  genre: 'Fiction',
  publicationYear: 2020 + id,
  coverImageUrl: null,
  curatorNote: `Note for book ${id}`,
  dateAdded,
  isSelectionDuMois,
  status: 'available',
});

describe('Home', () => {
  let fixture: ComponentFixture<Home>;
  let bookServiceMock: { getAll: ReturnType<typeof vi.fn> };

  async function create(books: Book[]) {
    bookServiceMock = { getAll: vi.fn().mockReturnValue(of(books)) };
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        { provide: BookService, useValue: bookServiceMock },
        provideAnimationsAsync(),
        provideRouter([]),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
  }

  it('shows empty state when no books', async () => {
    await create([]);
    const empty = fixture.nativeElement.querySelector('.catalog-empty');
    expect(empty?.textContent).toContain('La médiathèque est vide pour l\'instant.');
  });

  it('SelectionDuMoisCard is absent from DOM when no selection books', async () => {
    const books = [makeBook(1, '2026-04-01T00:00:00Z', false)];
    await create(books);
    const sdmSection = fixture.nativeElement.querySelector('[aria-label="Sélection du mois"]');
    expect(sdmSection).toBeNull();
  });

  it('SelectionDuMoisCard is present when isSelectionDuMois books exist', async () => {
    const books = [makeBook(1, '2026-04-01T00:00:00Z', true)];
    await create(books);
    const sdmSection = fixture.nativeElement.querySelector('[aria-label="Sélection du mois"]');
    expect(sdmSection).toBeTruthy();
  });

  it('Recently Added section shows up to 5 most recent books', async () => {
    const books = [
      makeBook(1, '2026-01-01T00:00:00Z'),
      makeBook(2, '2026-02-01T00:00:00Z'),
      makeBook(3, '2026-03-01T00:00:00Z'),
      makeBook(4, '2026-04-01T00:00:00Z'),
      makeBook(5, '2026-05-01T00:00:00Z'),
      makeBook(6, '2025-12-01T00:00:00Z'),
    ];
    await create(books);
    const recentlyAddedSection = fixture.nativeElement.querySelector('[aria-label="Nouveaux arrivages"]');
    expect(recentlyAddedSection).toBeTruthy();
    const listItems = recentlyAddedSection?.querySelectorAll('li');
    expect(listItems?.length).toBe(5); // shows only top 5
  });

  it('footer shows book count', async () => {
    const books = [makeBook(1, '2026-04-01T00:00:00Z'), makeBook(2, '2026-03-01T00:00:00Z')];
    await create(books);
    const footer = fixture.nativeElement.querySelector('.catalog-footer');
    expect(footer?.textContent).toContain('2 livres dans la collection');
  });

  it('catalog list renders all books', async () => {
    const books = [makeBook(1, '2026-04-01T00:00:00Z'), makeBook(2, '2026-03-01T00:00:00Z')];
    await create(books);
    const catalogSection = fixture.nativeElement.querySelector('[aria-label="Catalogue de livres"]');
    const items = catalogSection?.querySelectorAll('li');
    expect(items?.length).toBe(2);
  });
});
```

### Architecture Compliance

**Standalone components:** Both `SelectionDuMoisCard` and `Home` are `standalone: true`. No `@NgModule`.

**Angular 17+ control flow:** Use `@if` / `@for` — no `*ngIf` / `*ngFor`. No `NgIf`/`NgFor` imports needed.

**No extra API calls:** Derive `selectionBooks` and `recentlyAdded` from the single `getAll()` response. Pattern aligns with the architecture's "Component-level only — no NgRx" decision. For 60 books, client-side filtering is imperceptibly fast.

**CSS custom properties:** All colors via `var(--color-*)` (UX-DR1). No hardcoded hex values in component styles.

**No `window.history.back()`:** The "Voir le livre →" link uses `[routerLink]="['/livres', book.id]"` (UX-DR13).

**Loading state pattern** (architecture standard):
```typescript
isLoading = false;
this.isLoading = true;
service.call().subscribe({
  next: (data) => { ...; this.isLoading = false; },
  error: () => { this.isLoading = false; }
});
```

**`Intl.DateTimeFormat` for French dates:** Use browser-native `Intl` for French month/date formatting — no external date library needed. Angular Material does not provide date formatting utilities for display-only contexts.

### UX Specification — Homepage Layout (UX-DR8, UX-DR5, UX-DR14)

| Section | Spec | Implementation |
|---------|------|----------------|
| `SelectionDuMoisCard` | Top, absent if no featured books | `<app-selection-du-mois-card [books]="selectionBooks">` — component renders nothing when empty |
| Badge pill | Terracotta background, "Sélection du mois" | `.sdm-badge` with `background: var(--color-primary)`, white text |
| Month label | "Avril 2026" format, French | `Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })` + capitalize first char |
| Cover in card | `size="large"` (120×165px) | `<app-book-cover size="large">` |
| Curator note in card | Body large italic, full text (not clamped) | `font-size: 16px; line-height: 1.6; font-style: italic` on `.sdm-card__note` |
| "Voir le livre →" | Ghost link, terracotta (UX-DR16) | `color: var(--color-primary)` anchor with `[routerLink]` |
| Multiple books mobile | Horizontal scroll snap | `scroll-snap-type: x mandatory` + `overflow-x: auto` |
| Multiple books desktop | 2-col grid (≥960px) | `grid-template-columns: repeat(2, 1fr)` at `@media (min-width: 960px)` |
| Recently Added | 5 most recent, `dateAdded DESC` | `[...books].sort().slice(0,5)` — ISO 8601 strings sort lexicographically |
| Footer | "X livres · Mis à jour le [date]" | Label typography: 12px/500, `var(--color-on-surface-variant)` |
| Footer date | Most recent `dateAdded`, French format | `Intl.DateTimeFormat('fr-FR', { day:'numeric', month:'long', year:'numeric' })` |

### ISO 8601 Date Sort

ISO 8601 strings like `"2026-04-15T00:00:00Z"` are **lexicographically equivalent to chronological order**. Using `localeCompare()` on these strings is safe and avoids the overhead of `Date` object construction:

```typescript
// Sort DESC — most recent first
[...books].sort((a, b) => b.dateAdded.localeCompare(a.dateAdded))
```

This works because ISO 8601 is designed for this: year comes first, then month, then day — so string comparison yields the same order as date comparison.

### Scope Guard — What NOT to Implement in This Story

| Feature | Story |
|---------|-------|
| `FilterBarComponent` | Story 3.2 |
| Search/filter functionality | Story 3.2 |
| Admin Sélection du mois toggle | Story 5.3 |
| Admin FAB on homepage | N/A — admin has its own `/admin` route |
| Backend filtering (`?isSelectionDuMois=true` endpoint) | Already done in Story 2.1 |
| `BookService` changes | Not needed — filter client-side |
| Skeleton loaders for catalog list | Post-MVP (UX component roadmap Phase 3) |

### Previous Story Intelligence (Story 2.4)

Direct carry-overs from Story 2.4:

1. **`provideRouter([])` required in all tests** — `SelectionDuMoisCard` imports `RouterLink`, so the router must be provided. Omitting it causes `NullInjectorError: No provider for Router`.

2. **`provideAnimationsAsync()` required** — `BookCover` (imported by `SelectionDuMoisCard`) uses `MatIconModule` animations.

3. **`fixture.componentRef.setInput('books', value)`** — mandatory for Angular 17+ standalone components with `@Input()`. `component.books = []` bypasses Angular binding.

4. **Vitest `threads` pool** — `vitest.config.ts` + `angular.json` `runnerConfig: "vitest.config.ts"` must not be removed or modified.

5. **No `.component.ts` suffix** — class `SelectionDuMoisCard`, file `selection-du-mois-card.ts`.

6. **`@if`/`@for` control flow** — Angular 17+ block syntax. No `NgIf`/`NgFor` imports needed.

7. **Service injection via constructor** (`private bookService: BookService`) — same pattern as all previous stories.

8. **`debugElement.query(sel => sel.name === 'app-book-cover')`** — for finding child component instances in tests.

### Git Intelligence

Recent commits show:
- `1660970` / `4292c2a` — Story 2.4 (`BookDetail` page)
- `2c1ad1a` / `3e55da1` — Story 2.3 (`BookListItem` + `Home` catalog page with slot comments)
- `84699dc` / `0a3966d` — Story 2.2 (`BookCover`)

Story 2.3 left placeholder comments in `Home` specifically for this story:
```typescript
// Story 2.5: SelectionDuMoisCardComponent slot — add above catalog when implemented
// Story 2.5: Recently Added section slot — add above catalog when implemented
// Story 3.2: FilterBarComponent slot — add above catalog list when implemented
```

Replace the first two comments with actual code. **Keep the Story 3.2 comment.**

The `SelectionDuMoisCard` stub was created in Story 2.2 or 2.3 with `@Input() books: unknown[]` and a placeholder template. **Replace the entire file.**

### Test Count

- Prior: 24 tests (5 BookCover + 7 BookListItem + 12 BookDetail)
- Added: ~11 SelectionDuMoisCard + ~6 Home = ~17 new
- Expected total: ~41 tests — all must pass

### References

- `SelectionDuMoisCard` stub: [frontend/src/app/shared/components/selection-du-mois-card/selection-du-mois-card.ts](frontend/src/app/shared/components/selection-du-mois-card/selection-du-mois-card.ts)
- `Home` (catalog page): [frontend/src/app/features/catalog/home/home.ts](frontend/src/app/features/catalog/home/home.ts)
- `BookCover` (complete): [frontend/src/app/shared/components/book-cover/book-cover.ts](frontend/src/app/shared/components/book-cover/book-cover.ts)
- `BookListItem` (complete): [frontend/src/app/shared/components/book-list-item/book-list-item.ts](frontend/src/app/shared/components/book-list-item/book-list-item.ts)
- `Book` model: [frontend/src/app/shared/models/book.model.ts](frontend/src/app/shared/models/book.model.ts)
- `BookService.getAll()`: [frontend/src/app/shared/services/book.service.ts](frontend/src/app/shared/services/book.service.ts)
- Vitest config: [frontend/vitest.config.ts](frontend/vitest.config.ts)
- UX spec — SelectionDuMoisCard: `_bmad-output/planning-artifacts/ux-design-specification.md` — UX-DR5, UX-DR8, UX-DR14
- Architecture — Frontend file structure: `_bmad-output/planning-artifacts/architecture.md`
- Previous story: `_bmad-output/implementation-artifacts/2-4-book-detail-page.md`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_None yet — story not yet implemented._

### Completion Notes List

_To be filled by dev agent after implementation._

### File List

**Files to modify:**
- `frontend/src/app/shared/components/selection-du-mois-card/selection-du-mois-card.ts` — replace stub with full implementation
- `frontend/src/app/features/catalog/home/home.ts` — add SelectionDuMoisCard, Recently Added, footer

**New files to create:**
- `frontend/src/app/shared/components/selection-du-mois-card/selection-du-mois-card.spec.ts` — ~11 tests
- `frontend/src/app/features/catalog/home/home.spec.ts` — ~6 tests

## Change Log

| Date | Change |
|------|--------|
| 2026-04-16 | Story created — SelectionDuMoisCard + Recently Added + footer implementation guide. |

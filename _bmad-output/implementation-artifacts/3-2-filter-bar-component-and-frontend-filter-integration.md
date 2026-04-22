# Story 3.2: FilterBarComponent & Frontend Filter Integration

Status: ready-for-dev

## Story

As an employee,
I want a search bar and filter chips on the catalog page to instantly narrow the book list,
so that I can find a specific book without scrolling the entire catalog.

## Acceptance Criteria

1. **Given** the catalog page is loaded, **when** a user types in the search input, **then** results update in real time with a 300ms debounce — no "Search" button needed, and the catalog list below reflects the filtered results immediately.

2. **Given** the user selects a genre from the genre chip selector, **when** the chip is activated, **then** the catalog is filtered to books of that genre, and the chip displays in active style (terracotta filled vs. inactive grey).

3. **Given** the user selects a year from the year chip selector, **when** the chip is activated, **then** the catalog is filtered to books published that year, and both genre and year filters are applied simultaneously (AND logic).

4. **Given** at least one filter is active, **when** the filter bar renders, **then** a "× Effacer tout" chip appears; tapping it clears all active filters and resets the catalog to the full list.

5. **Given** the active filter combination returns zero results, **when** the catalog updates, **then** "Aucun livre ne correspond à votre recherche." is displayed with an "Effacer les filtres" button — the filter chips remain visible showing what the user selected.

6. **Given** the filter bar, **when** rendered, **then** it has `role="search"`, the text input has `aria-label="Rechercher dans le catalogue"`, and all chips have `aria-pressed` reflecting their active state.

## Tasks / Subtasks

- [ ] Task 1: Add `FilterCriteria` interface to `book.model.ts` (AC: all)
  - [ ] Open `frontend/src/app/shared/models/book.model.ts`
  - [ ] Append `FilterCriteria` interface after the existing `Book` interface (see Dev Notes for exact shape)

- [ ] Task 2: Add `getFiltered()` to `BookService` (AC: #1–#5)
  - [ ] Open `frontend/src/app/shared/services/book.service.ts`
  - [ ] Add `HttpParams` to the `HttpClient` import
  - [ ] Add `getFiltered(criteria: FilterCriteria): Observable<Book[]>` method (see Dev Notes)
  - [ ] Keep existing `getAll()` and `getById()` unchanged

- [ ] Task 3: Implement `FilterBarComponent` — replace placeholder (AC: #1–#6)
  - [ ] Open `frontend/src/app/shared/components/filter-bar/filter-bar.ts`
  - [ ] Replace the placeholder with the full standalone component (see Dev Notes for complete implementation)
  - [ ] Inputs: `genres: string[]`, `years: number[]`
  - [ ] Output: `filtersChanged: EventEmitter<FilterCriteria>`
  - [ ] Public method: `reset()` — clears all internal state and emits empty criteria
  - [ ] 300ms debounce on search input via `FormControl` + `debounceTime`
  - [ ] Genre chips: `mat-chip-listbox` / `mat-chip-option`, single-select, `aria-pressed`
  - [ ] Year chips: `mat-chip-listbox` / `mat-chip-option`, single-select, `aria-pressed`
  - [ ] "× Effacer tout" chip button visible when `hasActiveFilters` is true

- [ ] Task 4: Update `Home` component to integrate FilterBar (AC: #1–#5)
  - [ ] Open `frontend/src/app/features/catalog/home/home.ts`
  - [ ] Add `FilterBar` to imports
  - [ ] Add `@ViewChild(FilterBar) filterBar?: FilterBar` for programmatic reset
  - [ ] Add `availableGenres: string[]` and `availableYears: number[]` fields (populated from initial load)
  - [ ] Add `filteredBooks: Book[]` for the catalog section (separate from `books` which stays as full list)
  - [ ] Add `hasActiveFilters = false` flag
  - [ ] Add `filterChange$ = new Subject<FilterCriteria>()` + `switchMap` chain (see Dev Notes)
  - [ ] Add `onFiltersChanged(criteria: FilterCriteria)` handler (called from `(filtersChanged)` output)
  - [ ] Add `clearFilters()` method that calls `this.filterBar?.reset()`
  - [ ] Update template: place `<app-filter-bar>` above "Tout le catalogue" section (replace the slot comment)
  - [ ] Update template: bind `filteredBooks` (not `books`) in the catalog `@for` loop
  - [ ] Update template: add empty-state block for "Aucun livre ne correspond à votre recherche." + "Effacer les filtres" button
  - [ ] Note: "Recently Added" and "Sélection du mois" sections must use `books` (unchanged full list)

- [ ] Task 5: Validation
  - [ ] `ng build` — 0 TypeScript errors
  - [ ] `ng serve` — open browser at `http://localhost:4200`, verify full golden path:
    - Type in search box → catalog filters after 300ms
    - Select a genre chip → catalog filters, chip turns terracotta
    - Select a year chip → combined AND filter applies
    - "× Effacer tout" chip appears and clears all filters
    - Zero-result state shows correct message + "Effacer les filtres" button
    - "Recently Added" and "Sélection du mois" sections are NOT affected by filters

## Dev Notes

### Scope: Frontend only — 4 files modified, NO new files, NO backend changes

Backend filter API from Story 3.1 is already complete. This story wires the Angular frontend to it.

### What Already Exists — DO NOT Recreate

| Artifact | Location | Status |
|----------|----------|--------|
| `FilterBar` placeholder | `frontend/src/app/shared/components/filter-bar/filter-bar.ts` | EXISTS — full replace |
| `BookService` | `frontend/src/app/shared/services/book.service.ts` | COMPLETE — add method only |
| `Book` model | `frontend/src/app/shared/models/book.model.ts` | COMPLETE — append interface |
| `Home` component | `frontend/src/app/features/catalog/home/home.ts` | COMPLETE — update only |
| Backend `GET /api/books?keyword=&genre=&year=` | `backend/Controllers/BooksController.cs` | COMPLETE — do not touch |

### Task 1: `FilterCriteria` interface

Add to `frontend/src/app/shared/models/book.model.ts` (after the `Book` interface):

```typescript
export interface FilterCriteria {
  keyword: string;        // empty string when no keyword
  genre: string | null;   // null when no genre selected
  year: number | null;    // null when no year selected
}
```

### Task 2: `BookService.getFiltered()`

File: `frontend/src/app/shared/services/book.service.ts`

Add import: `import { HttpClient, HttpParams } from '@angular/common/http';`
Add `FilterCriteria` to the model import.

New method:
```typescript
getFiltered(criteria: FilterCriteria): Observable<Book[]> {
  let params = new HttpParams();
  if (criteria.keyword.trim()) params = params.set('keyword', criteria.keyword.trim());
  if (criteria.genre) params = params.set('genre', criteria.genre);
  if (criteria.year != null) params = params.set('year', criteria.year.toString());
  return this.http.get<Book[]>(this.apiUrl, { params });
}
```

### Task 3: Full `FilterBarComponent` Implementation

File: `frontend/src/app/shared/components/filter-bar/filter-bar.ts`

**Complete replacement** (the placeholder is ~10 lines):

```typescript
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { FilterCriteria } from '../../models/book.model';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatButtonModule,
  ],
  template: `
    <div class="filter-bar" role="search" aria-label="Rechercher dans le catalogue">

      <!-- Full-width search input — debounce handled in component -->
      <mat-form-field class="filter-bar__search" appearance="outline">
        <input matInput
               type="search"
               placeholder="Rechercher dans le catalogue..."
               [formControl]="searchControl"
               aria-label="Rechercher dans le catalogue">
      </mat-form-field>

      <!-- Genre chips — single-select -->
      @if (genres.length > 0) {
        <div class="filter-bar__chip-group" role="group" aria-label="Filtrer par genre">
          <span class="filter-bar__chip-label">Genre :</span>
          <mat-chip-listbox [multiple]="false"
                            [(value)]="selectedGenre"
                            (valueChange)="onGenreChange($event)">
            @for (genre of genres; track genre) {
              <mat-chip-option [value]="genre"
                               [attr.aria-pressed]="selectedGenre === genre">
                {{ genre }}
              </mat-chip-option>
            }
          </mat-chip-listbox>
        </div>
      }

      <!-- Year chips — single-select -->
      @if (years.length > 0) {
        <div class="filter-bar__chip-group" role="group" aria-label="Filtrer par année">
          <span class="filter-bar__chip-label">Année :</span>
          <mat-chip-listbox [multiple]="false"
                            [(value)]="selectedYear"
                            (valueChange)="onYearChange($event)">
            @for (year of years; track year) {
              <mat-chip-option [value]="year"
                               [attr.aria-pressed]="selectedYear === year">
                {{ year }}
              </mat-chip-option>
            }
          </mat-chip-listbox>
        </div>
      }

      <!-- Clear-all chip — visible only when any filter active (AC #4) -->
      @if (hasActiveFilters) {
        <button class="filter-bar__clear-chip"
                type="button"
                (click)="reset()">
          × Effacer tout
        </button>
      }

    </div>
  `,
  styles: [`
    .filter-bar {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }

    .filter-bar__search {
      width: 100%;
    }

    /* Remove default form-field bottom padding */
    .filter-bar__search ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }

    .filter-bar__chip-group {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .filter-bar__chip-label {
      font-size: 12px;
      font-weight: 500;
      color: var(--color-on-surface-variant);
      white-space: nowrap;
    }

    /* Active chip: terracotta fill */
    ::ng-deep .mat-mdc-chip-option.mat-mdc-chip-selected {
      background-color: var(--color-primary) !important;
      color: #ffffff !important;
    }

    /* Clear-all chip: styled as a chip button */
    .filter-bar__clear-chip {
      display: inline-flex;
      align-items: center;
      padding: 4px 12px;
      border: 1px solid var(--color-outline);
      border-radius: 16px;
      background: transparent;
      font-size: 13px;
      font-weight: 500;
      color: var(--color-on-surface-variant);
      cursor: pointer;
      transition: background 0.15s;
      align-self: flex-start;
    }

    .filter-bar__clear-chip:hover {
      background: var(--color-primary-container);
    }
  `]
})
export class FilterBar implements OnInit, OnDestroy {
  @Input() genres: string[] = [];
  @Input() years: number[] = [];
  @Output() filtersChanged = new EventEmitter<FilterCriteria>();

  searchControl = new FormControl('');
  selectedGenre: string | null = null;
  selectedYear: number | null = null;

  get hasActiveFilters(): boolean {
    return !!(this.searchControl.value?.trim() || this.selectedGenre || this.selectedYear != null);
  }

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => this._emit());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onGenreChange(genre: string | null): void {
    this.selectedGenre = genre ?? null;
    this._emit();
  }

  onYearChange(year: number | null): void {
    this.selectedYear = year ?? null;
    this._emit();
  }

  /** Called by parent Home via @ViewChild to clear all filters */
  reset(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.selectedGenre = null;
    this.selectedYear = null;
    this._emit();
  }

  private _emit(): void {
    this.filtersChanged.emit({
      keyword: this.searchControl.value ?? '',
      genre: this.selectedGenre,
      year: this.selectedYear,
    });
  }
}
```

**Key notes:**
- `debounceTime(300)` on search only — genre/year chips emit immediately on tap
- `reset()` uses `{ emitEvent: false }` to avoid double-emit from `valueChanges`
- `hasActiveFilters` is a getter — recalculated on every change detection cycle (tiny cost, no bugs)
- `takeUntil(this.destroy$)` prevents memory leak on component destroy

### Task 4: Updated `Home` Component

File: `frontend/src/app/features/catalog/home/home.ts`

**Additions to imports (TypeScript):**
```typescript
import { Subject, switchMap, of } from 'rxjs';
import { ViewChild } from '@angular/core';
import { FilterBar } from '../../../shared/components/filter-bar/filter-bar';
import { FilterCriteria } from '../../../shared/models/book.model';
```

Add `FilterBar` to the `imports` array of `@Component`.
Add `MatButtonModule` to imports (for the "Effacer les filtres" stroked button).

**New fields on the class:**
```typescript
allBooks: Book[] = [];          // never mutated after initial load
filteredBooks: Book[] = [];     // shown in the catalog section
availableGenres: string[] = []; // unique genres for FilterBar chips
availableYears: number[] = [];  // unique years for FilterBar chips
hasActiveFilters = false;

@ViewChild(FilterBar) filterBar?: FilterBar;

private filterChange$ = new Subject<FilterCriteria>();
```

**Updated `ngOnInit()`:**
```typescript
ngOnInit(): void {
  this.isLoading = true;

  // Wire filter stream with switchMap to cancel in-flight requests
  this.filterChange$.pipe(
    switchMap(criteria => {
      const hasFilter = !!(criteria.keyword.trim() || criteria.genre || criteria.year != null);
      if (!hasFilter) return of(this.allBooks);
      return this.bookService.getFiltered(criteria);
    })
  ).subscribe(books => {
    this.filteredBooks = books;
  });

  this.bookService.getAll().subscribe({
    next: (books) => {
      this.allBooks = books;
      this.filteredBooks = books;
      this.selectionBooks = books.filter(b => b.isSelectionDuMois);
      this.recentlyAdded = [...books]
        .sort((a, b) => b.dateAdded.localeCompare(a.dateAdded))
        .slice(0, 5);
      // Unique genres and years for FilterBar
      this.availableGenres = [...new Set(
        books.map(b => b.genre).filter((g): g is string => !!g)
      )].sort();
      this.availableYears = [...new Set(
        books.map(b => b.publicationYear).filter((y): y is number => y != null)
      )].sort((a, b) => b - a); // descending: most recent first
      this.isLoading = false;
    },
    error: () => { this.isLoading = false; }
  });
}
```

**New methods:**
```typescript
onFiltersChanged(criteria: FilterCriteria): void {
  this.hasActiveFilters = !!(criteria.keyword.trim() || criteria.genre || criteria.year != null);
  this.filterChange$.next(criteria);
}

clearFilters(): void {
  this.filterBar?.reset(); // FilterBar.reset() emits filtersChanged → onFiltersChanged → filterChange$
}
```

**Template changes — `Tout le catalogue` section (replace the slot comment and section):**
```html
<!-- FilterBar (Story 3.2, UX-DR6) -->
<app-filter-bar
  [genres]="availableGenres"
  [years]="availableYears"
  (filtersChanged)="onFiltersChanged($event)">
</app-filter-bar>

<section aria-label="Catalogue complet">
  <h2 class="section-heading">Tout le catalogue</h2>

  @if (filteredBooks.length === 0 && hasActiveFilters) {
    <!-- AC #5: no-results empty state -->
    <div class="catalog-empty-search">
      <p>Aucun livre ne correspond à votre recherche.</p>
      <button mat-stroked-button (click)="clearFilters()">Effacer les filtres</button>
    </div>
  } @else {
    <ul class="catalog-list" aria-label="Catalogue de livres">
      @for (book of filteredBooks; track book.id) {
        <li class="catalog-list__item">
          <app-book-list-item [book]="book" variant="default"></app-book-list-item>
        </li>
      }
    </ul>
  }
</section>
```

**Add this style to the Home component `styles`:**
```scss
.catalog-empty-search {
  padding: 32px 0;
  text-align: center;
  color: var(--color-on-surface-variant);
  font-size: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
```

**CRITICAL — do NOT change these lines in the template:**
- `this.books` → still used by `selectionBooks`, `recentlyAdded`, and the footer
- `this.allBooks` → populated from `getAll()`, drives `filteredBooks` when no filter active
- The `@for (book of books; ...)` in "Recently Added" must stay as `books` (not `filteredBooks`)

**Rename guidance:** The existing `this.books` field remains but now serves as the source for `selectionBooks`, `recentlyAdded`, `availableGenres`, `availableYears`, and `lastUpdatedLabel`. The new `this.allBooks` field is set from `getAll()` — set both: `this.allBooks = books; this.books = books;` OR rename `books` → `allBooks` throughout and update `filteredBooks` accordingly. Choose the approach that makes the code clearest. The simplest is to keep `books` for everything except the catalog list (which uses `filteredBooks`).

### Architecture Compliance

- **Standalone components** — `FilterBar` must have `standalone: true` in `@Component`
- **No NgModules** — import Material modules directly in the component's `imports` array
- **No `getAll()` modification** — add `getFiltered()` as a new method only
- **Controller → Service → API** — `Home` calls `BookService`, never `HttpClient` directly
- **`switchMap` for filter stream** — prevents stale results from race conditions
- **`takeUntil(destroy$)` in FilterBar** — prevents subscription leak (FilterBar can theoretically be destroyed)
- **camelCase JSON** — `keyword`, `genre`, `year` params match the backend's `[FromQuery]` parameter names exactly

### Backend API Contract (from Story 3.1)

`GET /api/books?keyword=equipe&genre=management&year=2023`

| Param | Backend field | Type | Notes |
|-------|--------------|------|-------|
| `keyword` | `string?` | text | case-insensitive, searches title + author + genre + curatorNote |
| `genre` | `string?` | text | case-insensitive contains match |
| `year` | `int?` | exact | exact `PublicationYear` match |

Empty params are ignored by the backend (AND logic: only present params filter).

### Chip Interaction Design (UX-DR6)

**Genre/year chips:** Single-select — selecting an already-selected chip deselects it (tap to toggle). This is the default behavior of `mat-chip-listbox` with `[multiple]="false"` when the same value is selected again. Verify this behavior in the browser.

**Active chip style:** The terracotta fill override in `FilterBar` styles targets `.mat-mdc-chip-option.mat-mdc-chip-selected`. Test that this applies correctly with Material M3 theme in place.

**"× Effacer tout" chip:** Plain button (not `mat-chip`), styled to look like a chip. Appears only when `hasActiveFilters === true`. Clicking it calls `reset()` which clears internal state and emits `{ keyword: '', genre: null, year: null }`.

### Previous Story Intelligence (from Story 3.1 and earlier)

1. **No `.component.ts` suffix** — Angular 21 components in this repo use `filter-bar.ts` (no `.component`). `FilterBar` class (no `Component` suffix). Same pattern as `Home`, `BookCover`, `BookListItem`.

2. **Standalone, no NgModules** — All components are standalone. Import all Material modules directly in the component's `imports: []` array. There is no `AppModule`.

3. **Home uses `constructor(private bookService: BookService) {}`** — Keep constructor injection. The `filterChange$` Subject should be initialized as a class field (not in constructor).

4. **Angular 17+ control flow** — Use `@if` / `@for` (not `*ngIf` / `*ngFor`). Already established in this codebase.

5. **Inline styles in `*.ts`** — All components use `styles: [\`...\`]` inline. Do NOT create separate `.scss` files.

6. **CSS custom properties for theming** — Always use `var(--color-primary)`, `var(--color-outline)`, etc. Never hardcode hex values in component styles.

### Scope Guard — What NOT to Implement in This Story

| Feature | Story |
|---------|-------|
| Admin book list filtering | Out of scope (admin uses separate component) |
| URL query parameter sync (router reflects filter state) | Out of scope (post-MVP) |
| Persistence of filter state across navigation | Out of scope |
| Free-text filter by title/author separately | Out of scope (keyword covers all fields) |
| Multi-select genre or year | Out of scope — single-select only |
| Backend changes | None — Story 3.1 is complete |

### References

- `FilterBar` placeholder (to replace): [frontend/src/app/shared/components/filter-bar/filter-bar.ts](frontend/src/app/shared/components/filter-bar/filter-bar.ts)
- `BookService` (to extend): [frontend/src/app/shared/services/book.service.ts](frontend/src/app/shared/services/book.service.ts)
- `book.model.ts` (to append): [frontend/src/app/shared/models/book.model.ts](frontend/src/app/shared/models/book.model.ts)
- `Home` component (to update): [frontend/src/app/features/catalog/home/home.ts](frontend/src/app/features/catalog/home/home.ts)
- `app.config.ts`: [frontend/src/app/app.config.ts](frontend/src/app/app.config.ts)
- UX spec — UX-DR6 (FilterBar), UX-DR15 (empty states): `_bmad-output/planning-artifacts/ux-design-specification.md`
- Backend filter API: `_bmad-output/implementation-artifacts/3-1-backend-search-and-filter-api.md`
- Architecture — Frontend structure, naming, anti-patterns: `_bmad-output/planning-artifacts/architecture.md`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List

- frontend/src/app/shared/models/book.model.ts
- frontend/src/app/shared/services/book.service.ts
- frontend/src/app/shared/components/filter-bar/filter-bar.ts
- frontend/src/app/features/catalog/home/home.ts

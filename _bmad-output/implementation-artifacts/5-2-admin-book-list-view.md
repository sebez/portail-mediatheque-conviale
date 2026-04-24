# Story 5.2: Admin Book List View

Status: review

## Story

As the library animator,
I want to see all books in the admin interface with edit and delete actions,
so that I can manage the full catalog from my smartphone.

## Acceptance Criteria

1. **Given** the admin navigates to `/admin`, **when** the book list loads, **then** all books are displayed using the `compact` variant of `BookListItemComponent` (cover + title + author, no curator note preview), and each item shows an edit icon button (✏️) and a delete icon button (🗑️).

2. **Given** the admin taps the edit icon on a book, **when** it is activated, **then** the admin is navigated to `/admin/livres/:id/modifier`.

3. **Given** the catalog has no books, **when** the admin book list renders, **then** "La médiathèque est vide pour l'instant." is shown with an "Ajouter un livre" button.

4. **Given** the admin book list view, **when** it renders, **then** a fixed FAB (`mat-fab` extended, "Ajouter un livre") is visible at bottom-right (`position: fixed`), and tapping it navigates to `/admin/livres/nouveau`.

5. **Given** `mat-icon-button` actions have no visible text label, **when** rendered, **then** each has an `aria-label` ("Modifier [titre]", "Supprimer [titre]").

## Tasks / Subtasks

- [x] Task 1: Implement `BookList` component (AC: #1, #2, #3, #4, #5)
  - [x] Replace stub in `frontend/src/app/features/admin/book-list/book-list.ts` with full standalone component
  - [x] Inject `BookService` and `Router` via `inject()`
  - [x] Load books on `ngOnInit` using `bookService.getAll().subscribe(...)` with `isLoading` signal
  - [x] Render `BookListItemComponent` with `variant="compact"` for each book (DO NOT use routerLink — the component handles routing for public; admin row needs custom click handling for edit/delete)
  - [x] Wrap each book row: cover area uses `BookListItemComponent` (compact), with edit + delete `mat-icon-button` in an action column beside it
  - [x] Wire edit button → `router.navigate(['/admin/livres', book.id, 'modifier'])`
  - [x] Wire delete button → `onDeleteClick(book)` stub (placeholder, implemented in Story 5.4) — leave method body empty for now
  - [x] Add `aria-label` on each icon button: `"Modifier " + book.title` and `"Supprimer " + book.title`
  - [x] Add empty state block: visible when `books.length === 0` and not loading
  - [x] Add FAB (`mat-fab` extended, bottom-right fixed) navigating to `/admin/livres/nouveau`
  - [x] Add `mat-progress-spinner` shown while `isLoading` is true

- [x] Task 2: Validation
  - [x] `ng build` in `frontend/` — 0 errors, 0 warnings
  - [x] Manual: navigate to `/admin` while authenticated — book list renders with all books
  - [x] Manual: tap edit icon on a book — navigates to `/admin/livres/:id/modifier`
  - [x] Manual: if no books exist — empty state message and "Ajouter un livre" button visible
  - [x] Manual: FAB "Ajouter un livre" tapped — navigates to `/admin/livres/nouveau`

## Dev Notes

### Scope: 1 file to implement

| Action | File | Notes |
|--------|------|-------|
| Replace stub with full impl | `frontend/src/app/features/admin/book-list/book-list.ts` | Stub is a placeholder with 3 lines — replace entirely |

No new routes, services, or models required.

### What ALREADY EXISTS — DO NOT Recreate

| File | What's already there |
|------|----------------------|
| `frontend/src/app/features/admin/book-list/book-list.ts` | Stub placeholder — `@Component({ template: '<p>…à venir</p>' })` — REPLACE entirely |
| `frontend/src/app/shared/services/book.service.ts` | `getAll(): Observable<Book[]>` is implemented and working |
| `frontend/src/app/shared/models/book.model.ts` | `Book` interface with all 11 fields (id, isbn, title, author, genre, publicationYear, coverImageUrl, curatorNote, dateAdded, isSelectionDuMois, status) |
| `frontend/src/app/shared/components/book-list-item/book-list-item.ts` | `BookListItem` standalone component — accepts `@Input() book: Book` and `@Input() variant: 'default' \| 'compact'` — `compact` shows cover + title + author, no curator note |
| `frontend/src/app/features/admin/admin.routes.ts` | `/livres` route loads `BookList`; `/livres/nouveau` and `/livres/:id/modifier` load `BookForm` |
| `frontend/src/app/features/admin/admin-shell/admin-shell.ts` | Dark toolbar (`#1A1A1A`) + logout button + `<router-outlet>` — BookList renders inside it via `router-outlet` |
| `frontend/src/app/shared/components/book-cover/book-cover.ts` | `BookCover` standalone component — already imported by `BookListItem` |
| `frontend/src/app/app.config.ts` | `scrollPositionRestoration: 'enabled'` already configured — nothing to add |

### Task 1: `book-list.ts` — Full Implementation

**CRITICAL DESIGN DECISION:** `BookListItemComponent` uses an `<a [routerLink]="['/livres', book.id]">` wrapping the entire item — this routes to the PUBLIC detail page. In the admin list, each row must show the book info (using compact variant) PLUS separate edit/delete action buttons. The simplest approach is to lay out each row as a flex container: the `BookListItem` (compact) on the left for book display, and an actions column on the right for the icon buttons. Since `BookListItem` already wraps itself in a `<a>` pointing to public catalog, consider either:

- Option A (preferred): Render `BookListItem` with `variant="compact"` for display only — the icon buttons are placed in a sibling column. The row wrapper is a `<div>`, not a link. The public `/livres/:id` link from `BookListItem`'s `<a>` still works if clicked on the book area.
- Option B: Build the row inline without using `BookListItem`, repeating the compact layout. **Avoid this** — reinvents the wheel.

**Use Option A.** The `BookListItem` component is already built and correct; just wrap it with an actions column.

```typescript
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BookService } from '../../../shared/services/book.service';
import { BookListItem } from '../../../shared/components/book-list-item/book-list-item';
import { Book } from '../../../shared/models/book.model';

@Component({
  selector: 'app-admin-book-list',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink,
    BookListItem,
  ],
  template: `
    @if (isLoading()) {
      <div class="loading-container">
        <mat-progress-spinner mode="indeterminate" diameter="40" />
      </div>
    } @else if (books().length === 0) {
      <div class="empty-state">
        <p>La médiathèque est vide pour l'instant.</p>
        <a mat-stroked-button routerLink="/admin/livres/nouveau">Ajouter un livre</a>
      </div>
    } @else {
      <ul class="book-list" role="list">
        @for (book of books(); track book.id) {
          <li class="book-list__row">
            <div class="book-list__item">
              <app-book-list-item [book]="book" variant="compact" />
            </div>
            <div class="book-list__actions">
              <button mat-icon-button
                      [attr.aria-label]="'Modifier ' + book.title"
                      (click)="onEditClick(book)">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button
                      [attr.aria-label]="'Supprimer ' + book.title"
                      (click)="onDeleteClick(book)">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </li>
        }
      </ul>
    }

    <button mat-fab extended
            class="add-fab"
            routerLink="/admin/livres/nouveau"
            aria-label="Ajouter un livre">
      <mat-icon>add</mat-icon>
      Ajouter un livre
    </button>
  `,
  styles: [`
    :host {
      display: block;
      padding: 0 16px 96px; /* bottom padding so FAB doesn't obscure last item */
      max-width: 800px;
      margin: 0 auto;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 48px 0;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 48px 0;
      color: var(--color-on-surface-variant);
      text-align: center;
    }

    .book-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .book-list__row {
      display: flex;
      align-items: center;
      border-bottom: 1px solid var(--color-outline);
    }

    .book-list__row:last-child {
      border-bottom: none;
    }

    .book-list__item {
      flex: 1;
      min-width: 0;
    }

    .book-list__actions {
      display: flex;
      flex-shrink: 0;
      gap: 4px;
      padding-left: 8px;
    }

    /* FAB fixed bottom-right — UX-DR10 */
    .add-fab {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 10;
    }
  `],
})
export class BookList implements OnInit {
  private bookService = inject(BookService);
  private router = inject(Router);

  books = signal<Book[]>([]);
  isLoading = signal(true);

  ngOnInit(): void {
    this.bookService.getAll().subscribe({
      next: (books) => {
        this.books.set(books);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  onEditClick(book: Book): void {
    this.router.navigate(['/admin/livres', book.id, 'modifier']);
  }

  onDeleteClick(_book: Book): void {
    // Implemented in Story 5.4 — will open mat-dialog confirmation
  }
}
```

**Critical notes:**
- `signal<Book[]>([])` and `signal(true)` — use Angular signals for reactive state (pattern established in `AdminShell` and existing components)
- `standalone: true` — all admin components are standalone (architecture rule: no NgModules)
- `@for ... track book.id` — Angular 17+ control flow syntax (already used in other components in this project)
- `mat-fab extended` — Angular Material FAB with text label (UX-DR10: "mat-fab extended, 'Ajouter un livre'")
- `position: fixed; bottom: 24px; right: 24px` — required by UX-DR10
- `onDeleteClick` left empty — Story 5.4 implements the dialog; stub must exist so delete icon button compiles
- The `padding-bottom: 96px` on `:host` prevents the FAB from obscuring the last book item on scroll
- Error state: just hide the spinner and show the (empty) list — no inline error for MVP (the list will be empty if load fails)
- Import `RouterLink` for the FAB's `routerLink` directive and the empty-state button

### Architecture Compliance

- Standalone component with `inject()` pattern (architecture rule: no constructor DI for standalone components using inject())
- `BookService.getAll()` via HTTP interceptor (auth token automatically attached — `auth.interceptor.ts` already wired in `app.config.ts`)
- Never inject `AppDbContext` — Angular components call services only
- `environment.apiUrl` is used inside `BookService`, never hardcoded in components
- Loading state pattern: `isLoading = signal(true)` set to `false` in both `next` and `error` callbacks — matches architecture pattern
- Routing: `router.navigate(['/admin/livres', book.id, 'modifier'])` — never `window.location.href`
- `aria-label` on all `mat-icon-button` elements — accessibility rule (UX-DR10, story AC #5)

### Critical Anti-Patterns to Avoid

| Anti-pattern | Correct pattern |
|---|---|
| Rebuilding the book row layout from scratch | Use `BookListItem` with `variant="compact"` — it already exists |
| Adding `[routerLink]` to the entire row | Row is a `<li>` with flex layout — edit/delete are separate buttons |
| Using `ngModel` or template-driven forms | Not applicable for a list view; no forms here |
| Calling `bookService.delete()` in this story | Delete API call is Story 5.4; only stub `onDeleteClick` |
| `console.log()` left in code | Remove before commit |
| Using `ChangeDetectorRef` or `markForCheck` | Signals handle reactivity automatically |
| `@NgModule` imports | All components are standalone — no modules |
| Hard-coding colors inline | Use CSS custom properties: `var(--color-primary)`, `var(--color-outline)`, etc. |

### File Structure Notes

Only one file changes:
```
frontend/src/app/
  features/
    admin/
      book-list/
        book-list.ts            ← REPLACE stub with full implementation (shown above)
```

No spec file required for MVP (no unit test for the list component beyond what Angular default provides).
No new routes — routing already configured in `admin.routes.ts`.
No `BookService` changes — `getAll()` is already implemented and correct.

### Angular Material Imports Reference

The following Material modules are needed (all available in Angular Material — no additional `npm install`):

| Import | Usage |
|--------|-------|
| `MatButtonModule` | `mat-icon-button`, `mat-stroked-button`, `mat-fab` |
| `MatIconModule` | `<mat-icon>edit</mat-icon>`, `<mat-icon>delete</mat-icon>`, `<mat-icon>add</mat-icon>` |
| `MatProgressSpinnerModule` | `<mat-progress-spinner mode="indeterminate">` |
| `RouterLink` (from `@angular/router`) | `routerLink="/admin/livres/nouveau"` on FAB and empty-state button |
| `BookListItem` | From `../../../shared/components/book-list-item/book-list-item` |

### UX Compliance Notes

Per UX-DR10:
- FAB must be `mat-fab extended` (not `mat-mini-fab`) with label "Ajouter un livre" and `position: fixed` bottom-right
- Admin app bar already dark `#1A1A1A` — provided by `AdminShell`, nothing to add here

Per UX-DR15 (empty state):
- "La médiathèque est vide pour l'instant." with an "Ajouter un livre" action for admin (not the public empty state)

Per UX-DR16 (button hierarchy):
- Edit: `mat-icon-button` (ghost)
- Delete: `mat-icon-button` (ghost, will become destructive red `#B00020` in Story 5.4)
- FAB: `mat-fab extended` — the single primary add action

### Previous Story Intelligence

From Story 5.1 (backend CRUD API — now in review):
- The `DELETE /api/books/{id}` endpoint is implemented and returns 204
- The `BookService` on the frontend has only `getAll()`, `getById()`, and `getFiltered()` — no `delete()` method yet
  - Story 5.4 will add `delete(id: number)` to `BookService`; Story 5.2 does NOT need it
- Test pattern: Story 5.1 used `FakeHttpClientFactory` in tests — frontend tests use Jasmine/Karma with `HttpClientTestingModule`

From Story 4.3 (Admin Login Page & Admin App Shell — in review):
- `AdminShell` is the parent component rendering `<router-outlet>` — `BookList` renders inside it
- Auth token is already in `localStorage` when admin reaches `/admin` — the HTTP interceptor attaches it automatically
- `admin.routes.ts` already has all 4 child routes configured (`livres`, `livres/nouveau`, `livres/:id/modifier`, redirect '')

### Git Intelligence

Recent commit pattern: commits are prefixed with "Story X-Y-story-slug". Example:
```
f7e37f7 Story 5-1-book-crud-api-create-update-delete-endpoints
a1a5f38 Story 4-3-admin-login-page-and-admin-app-shell
```
All Angular component files (`.ts`) are in the same commit without spec files for admin features.

### References

- Story 5.2 acceptance criteria: `_bmad-output/planning-artifacts/epics.md` (section "Story 5.2")
- Previous story 5.1: [_bmad-output/implementation-artifacts/5-1-book-crud-api-create-update-delete-endpoints.md](_bmad-output/implementation-artifacts/5-1-book-crud-api-create-update-delete-endpoints.md)
- Admin routes (already configured): [frontend/src/app/features/admin/admin.routes.ts](frontend/src/app/features/admin/admin.routes.ts)
- Admin shell (parent component): [frontend/src/app/features/admin/admin-shell/admin-shell.ts](frontend/src/app/features/admin/admin-shell/admin-shell.ts)
- BookListItem component (compact variant): [frontend/src/app/shared/components/book-list-item/book-list-item.ts](frontend/src/app/shared/components/book-list-item/book-list-item.ts)
- BookService (getAll already implemented): [frontend/src/app/shared/services/book.service.ts](frontend/src/app/shared/services/book.service.ts)
- Book model: [frontend/src/app/shared/models/book.model.ts](frontend/src/app/shared/models/book.model.ts)
- BookList stub to replace: [frontend/src/app/features/admin/book-list/book-list.ts](frontend/src/app/features/admin/book-list/book-list.ts)
- UX spec (admin list, FAB, empty states, button hierarchy): `_bmad-output/planning-artifacts/ux-design-specification.md`
- Architecture (Angular patterns, structure): `_bmad-output/planning-artifacts/architecture.md`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None — implementation followed the exact spec from Dev Notes without deviations.

### Completion Notes List

- Replaced the 3-line stub in `book-list.ts` with the full standalone `BookList` component
- Used Angular signals (`signal<Book[]>([])`, `signal(true)`) for reactive state — matches architecture pattern
- Implemented flex row layout: `BookListItemComponent` (compact) on left, edit/delete `mat-icon-button` on right — Option A from Dev Notes
- `onDeleteClick` left as empty stub per spec — Story 5.4 implements the dialog
- FAB (`mat-fab extended`) fixed bottom-right with `position: fixed; bottom: 24px; right: 24px` — UX-DR10 compliant
- Empty state renders "La médiathèque est vide pour l'instant." with "Ajouter un livre" stroked button — UX-DR15 compliant
- All `mat-icon-button` elements have `aria-label` ("Modifier [title]", "Supprimer [title]") — AC #5 compliant
- `ng build` completed with 0 errors, 0 warnings (book-list chunk: 3.19 kB)

### File List

- `frontend/src/app/features/admin/book-list/book-list.ts` (replaced stub with full implementation)

### Change Log

- 2026-04-23: Implemented Story 5.2 — Admin Book List View. Replaced stub with full `BookList` standalone component featuring compact book rows with edit/delete actions, loading spinner, empty state, and fixed FAB.

# Story 5.3: Add & Edit Book Form

Status: review

## Story

As the library animator,
I want a form to add a new book or edit an existing one with all fields — including curator note and Sélection du mois toggle — and immediate save confirmation,
So that I can maintain the catalog accurately from my smartphone.

## Acceptance Criteria

1. **Given** the admin navigates to `/admin/livres/nouveau`, **when** the form renders, **then** all fields appear in this order: ISBN (text input), Titre, Auteur(s), Genre/Catégorie, Année de publication, Couverture (URL), Note du curateur, Sélection du mois (`mat-slide-toggle`), and all fields are single-column, full-width on mobile.

2. **Given** the admin navigates to `/admin/livres/:id/modifier`, **when** the form renders, **then** all fields are pre-filled with the existing book data and fully editable.

3. **Given** the admin fills in the form and taps "Enregistrer", **when** the save succeeds (POST 201 or PUT 200), **then** a `mat-snack-bar` confirmation appears ("Livre ajouté ✓" or "Livre mis à jour ✓") and auto-dismisses after 3 seconds, and the admin is navigated back to `/admin`.

4. **Given** the admin toggles "Sélection du mois" ON for a book and saves, **when** the public homepage loads, **then** that book appears in the `SelectionDuMoisCardComponent`.

5. **Given** the admin toggles "Sélection du mois" OFF for a previously featured book and saves, **when** the public homepage loads, **then** that book no longer appears in the `SelectionDuMoisCardComponent`.

6. **Given** the form is in add mode, **when** rendered, **then** the ISBN field is a plain text input (pre-wired for barcode scan integration in Epic 6).

## Tasks / Subtasks

- [x] Task 1: Add `create()` and `update()` to `BookService` and request interfaces to `book.model.ts` (AC: #3)
  - [x] Append `CreateBookRequest` and `UpdateBookRequest` interfaces to `frontend/src/app/shared/models/book.model.ts`
  - [x] Add `create(data: CreateBookRequest): Observable<Book>` to `BookService` — POST to `apiUrl`
  - [x] Add `update(id: number, data: UpdateBookRequest): Observable<Book>` to `BookService` — PUT to `apiUrl/${id}`
  - [x] Update `BookService` import to include `CreateBookRequest, UpdateBookRequest` from model

- [x] Task 2: Implement `BookForm` component (AC: #1, #2, #3, #4, #5, #6)
  - [x] Replace stub in `frontend/src/app/features/admin/book-form/book-form.ts` with full standalone component
  - [x] Detect mode: `inject(ActivatedRoute).snapshot.paramMap.get('id')` — null = add, string = edit
  - [x] Build `FormGroup` via `inject(FormBuilder)`: `isbn` (required), `title` (required), `author` (required), `genre`, `publicationYear`, `coverImageUrl`, `curatorNote`, `isSelectionDuMois` (boolean, false default)
  - [x] In edit mode: call `bookService.getById(Number(bookId))`, patch form with response; show spinner while loading
  - [x] On submit: call `create()` or `update()`, set `isSaving` signal during save, disable button
  - [x] On save success: `snackBar.open(message, undefined, { duration: 3000 })` then `router.navigate(['/admin'])`
  - [x] On load error in edit mode: navigate back to `/admin` (book may have been deleted)
  - [x] On save error: reset `isSaving` to false (user can retry — no inline error for MVP)

- [ ] Task 3: Validation
  - [x] `ng build` in `frontend/` — 0 errors, 0 warnings
  - [ ] Manual: `/admin/livres/nouveau` — form shows all 8 fields in correct order, all full-width
  - [ ] Manual: fill required fields and save — snackbar "Livre ajouté ✓" appears, navigated to `/admin`
  - [ ] Manual: `/admin/livres/:id/modifier` — all fields pre-filled with existing book data
  - [ ] Manual: edit a field and save — snackbar "Livre mis à jour ✓" appears, navigated to `/admin`
  - [ ] Manual: toggle Sélection du mois ON and save — book appears on public homepage

## Dev Notes

### Scope: 3 files to modify

| Action | File | Notes |
|--------|------|-------|
| Replace stub with full impl | `frontend/src/app/features/admin/book-form/book-form.ts` | Stub is 3 lines, NOT standalone — replace entirely |
| Add `create()` and `update()` | `frontend/src/app/shared/services/book.service.ts` | Only additions; existing `getAll()`, `getById()`, `getFiltered()` unchanged |
| Append request interfaces | `frontend/src/app/shared/models/book.model.ts` | Append after `FilterCriteria`; existing interfaces unchanged |

No new routes. No backend changes. No new services.

### What ALREADY EXISTS — DO NOT Recreate

| File | What's already there |
|------|----------------------|
| `frontend/src/app/features/admin/book-form/book-form.ts` | Stub — `@Component({ template: '<p>Formulaire livre…</p>' })` — REPLACE entirely |
| `frontend/src/app/features/admin/admin.routes.ts` | `/livres/nouveau` and `/livres/:id/modifier` already load `BookForm` via `loadComponent` — NO changes needed |
| `frontend/src/app/shared/services/book.service.ts` | `getAll()`, `getById()`, `getFiltered()` — only ADD `create()` and `update()` |
| `frontend/src/app/shared/models/book.model.ts` | `Book` interface (11 fields), `FilterCriteria` — only APPEND two new interfaces |
| `frontend/src/app/features/admin/admin-shell/admin-shell.ts` | Dark toolbar reads `data.title` from route data — routes already set `'Ajouter un livre'` and `'Modifier un livre'` |
| `frontend/src/app/features/admin/book-list/book-list.ts` | `onDeleteClick` stub — DO NOT touch; Story 5.4 implements the dialog |
| `frontend/src/app/shared/services/auth.service.ts` | JWT in localStorage; HTTP interceptor attaches token — nothing to add |

### Task 1: Model and Service Additions

**Append to `book.model.ts`** (after the existing `FilterCriteria` interface):

```typescript
export interface CreateBookRequest {
  isbn: string;
  title: string;
  author: string;
  genre: string;
  publicationYear: number;
  coverImageUrl: string | null;
  curatorNote: string | null;
  isSelectionDuMois: boolean;
}

export interface UpdateBookRequest extends CreateBookRequest {
  status: string;
}
```

**Changes to `book.service.ts`**:

1. Update import line to add the two new types:
```typescript
import { Book, FilterCriteria, CreateBookRequest, UpdateBookRequest } from '../models/book.model';
```

2. Add two methods to the `BookService` class body (after `getFiltered`):
```typescript
create(data: CreateBookRequest): Observable<Book> {
  return this.http.post<Book>(this.apiUrl, data);
}

update(id: number, data: UpdateBookRequest): Observable<Book> {
  return this.http.put<Book>(`${this.apiUrl}/${id}`, data);
}
```

### Task 2: `book-form.ts` — Full Implementation

**CRITICAL:** The stub is missing `standalone: true`. The route uses `loadComponent` which requires a standalone component. The stub will fail at runtime without `standalone: true`.

```typescript
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BookService } from '../../../shared/services/book.service';

@Component({
  selector: 'app-book-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    RouterLink,
  ],
  template: `
    @if (isLoading()) {
      <div class="loading-container">
        <mat-progress-spinner mode="indeterminate" diameter="40" />
      </div>
    } @else {
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="book-form">
        <mat-form-field appearance="outline">
          <mat-label>ISBN</mat-label>
          <input matInput formControlName="isbn" type="text" autocomplete="off" />
          @if (form.get('isbn')?.invalid && form.get('isbn')?.touched) {
            <mat-error>L'ISBN est requis</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Titre</mat-label>
          <input matInput formControlName="title" />
          @if (form.get('title')?.invalid && form.get('title')?.touched) {
            <mat-error>Le titre est requis</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Auteur(s)</mat-label>
          <input matInput formControlName="author" />
          @if (form.get('author')?.invalid && form.get('author')?.touched) {
            <mat-error>L'auteur est requis</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Genre / Catégorie</mat-label>
          <input matInput formControlName="genre" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Année de publication</mat-label>
          <input matInput formControlName="publicationYear" type="number" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Couverture (URL)</mat-label>
          <input matInput formControlName="coverImageUrl" type="url" autocomplete="off" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Note du curateur</mat-label>
          <textarea matInput formControlName="curatorNote" rows="5"></textarea>
        </mat-form-field>

        <div class="toggle-field">
          <mat-slide-toggle formControlName="isSelectionDuMois">
            Sélection du mois
          </mat-slide-toggle>
        </div>

        <div class="form-actions">
          <button mat-stroked-button type="button" routerLink="/admin">
            Annuler
          </button>
          <button mat-raised-button color="primary" type="submit"
                  [disabled]="isSaving() || form.invalid">
            @if (isSaving()) {
              <mat-progress-spinner diameter="20" mode="indeterminate" />
            } @else {
              Enregistrer
            }
          </button>
        </div>
      </form>
    }
  `,
  styles: [`
    :host {
      display: block;
      padding: 24px 16px 48px;
      max-width: 600px;
      margin: 0 auto;
    }

    .book-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    mat-form-field {
      width: 100%;
    }

    .toggle-field {
      padding: 8px 0;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 48px 0;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 8px;
    }
  `],
})
export class BookForm implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private bookService = inject(BookService);
  private snackBar = inject(MatSnackBar);

  private bookId = this.route.snapshot.paramMap.get('id');
  isEditMode = this.bookId !== null;

  isLoading = signal(false);
  isSaving = signal(false);

  form = this.fb.group({
    isbn: ['', Validators.required],
    title: ['', Validators.required],
    author: ['', Validators.required],
    genre: [''],
    publicationYear: [0],
    coverImageUrl: [''],
    curatorNote: [''],
    isSelectionDuMois: [false],
  });

  ngOnInit(): void {
    if (this.isEditMode && this.bookId) {
      this.isLoading.set(true);
      this.bookService.getById(Number(this.bookId)).subscribe({
        next: (book) => {
          this.form.patchValue({
            isbn: book.isbn,
            title: book.title,
            author: book.author,
            genre: book.genre ?? '',
            publicationYear: book.publicationYear,
            coverImageUrl: book.coverImageUrl ?? '',
            curatorNote: book.curatorNote ?? '',
            isSelectionDuMois: book.isSelectionDuMois,
          });
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.router.navigate(['/admin']);
        },
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSaving()) return;

    const value = this.form.getRawValue();
    this.isSaving.set(true);

    if (this.isEditMode && this.bookId) {
      this.bookService.update(Number(this.bookId), {
        isbn: value.isbn ?? '',
        title: value.title ?? '',
        author: value.author ?? '',
        genre: value.genre ?? '',
        publicationYear: value.publicationYear ?? 0,
        coverImageUrl: value.coverImageUrl || null,
        curatorNote: value.curatorNote || null,
        isSelectionDuMois: value.isSelectionDuMois ?? false,
        status: 'available',
      }).subscribe({
        next: () => this.handleSaveSuccess('Livre mis à jour ✓'),
        error: () => this.isSaving.set(false),
      });
    } else {
      this.bookService.create({
        isbn: value.isbn ?? '',
        title: value.title ?? '',
        author: value.author ?? '',
        genre: value.genre ?? '',
        publicationYear: value.publicationYear ?? 0,
        coverImageUrl: value.coverImageUrl || null,
        curatorNote: value.curatorNote || null,
        isSelectionDuMois: value.isSelectionDuMois ?? false,
      }).subscribe({
        next: () => this.handleSaveSuccess('Livre ajouté ✓'),
        error: () => this.isSaving.set(false),
      });
    }
  }

  private handleSaveSuccess(message: string): void {
    this.snackBar.open(message, undefined, { duration: 3000 });
    this.router.navigate(['/admin']);
  }
}
```

**Critical notes:**
- `standalone: true` MUST be present — the stub is missing it; `loadComponent` in routes requires it
- `inject()` for all dependencies — no constructor DI (architecture rule for standalone components)
- `FormBuilder` via `inject(FormBuilder)` — architecture mandates Reactive Forms for admin
- `form.getRawValue()` not `form.value` — ensures all controls included even if disabled later
- `coverImageUrl: value.coverImageUrl || null` — empty string must convert to null (backend nullable field)
- `curatorNote: value.curatorNote || null` — same pattern
- `status: 'available'` hardcoded in UpdateBookRequest — admin UI does not expose status field for MVP (FR26 is forward-compat only)
- `isLoading = signal(false)` — only set to `true` in edit mode while fetching; add mode shows form immediately
- Edit mode load error → `router.navigate(['/admin'])` — book may have been deleted; no dead end
- `isSaving` must reset to `false` in error callback — otherwise the button stays disabled and user is stuck

### Architecture Compliance

- Standalone component with `inject()` pattern (architecture rule: no constructor DI)
- Reactive Forms via `FormBuilder` (architecture decision: "Admin forms: Reactive Forms — programmatic auto-fill, async validators, state inspection")
- HTTP interceptor attaches JWT automatically (`auth.interceptor.ts` wired in `app.config.ts`)
- `environment.apiUrl` used inside `BookService` — never hardcoded in components
- `router.navigate(['/admin'])` after save — never `window.location.href` or `window.history.back()`
- `mat-snack-bar` 3-second auto-dismiss — UX-DR10 compliance

### Angular Material Imports Reference

| Import | Usage |
|--------|-------|
| `ReactiveFormsModule` | `[formGroup]`, `formControlName` directives |
| `MatFormFieldModule` | `<mat-form-field appearance="outline">` |
| `MatInputModule` | `matInput` directive on `<input>` and `<textarea>` |
| `MatButtonModule` | `mat-raised-button`, `mat-stroked-button` |
| `MatProgressSpinnerModule` | Loading state + inline save spinner in button |
| `MatSlideToggleModule` | `<mat-slide-toggle>` for Sélection du mois |
| `MatSnackBarModule` | `MatSnackBar` injection + `open()` call |
| `RouterLink` | `routerLink="/admin"` on Annuler button |

All modules available in Angular Material — no additional `npm install`.

### Critical Anti-Patterns to Avoid

| Anti-pattern | Correct pattern |
|---|---|
| `standalone: false` or missing `standalone` | Must be `standalone: true` — `loadComponent` requires it |
| Constructor-based DI (`constructor(private fb: FormBuilder)`) | `inject(FormBuilder)` — architecture rule for standalone |
| Template-driven forms (`ngModel`, `FormsModule`) | `ReactiveFormsModule` + `FormBuilder` — architecture mandate |
| `this.form.value` on submit | `this.form.getRawValue()` — safer, includes disabled controls |
| `coverImageUrl: value.coverImageUrl` (empty string) | `coverImageUrl: value.coverImageUrl \|\| null` — nullable backend field |
| `window.location.href = '/admin'` | `router.navigate(['/admin'])` |
| Not resetting `isSaving` to false on error | Must reset in error callback — button remains disabled otherwise |
| `@NgModule` imports | All components are standalone — no modules |
| Touching `book-list.ts` | Do NOT modify; `onDeleteClick` stub is Story 5.4's responsibility |

### UX Compliance Notes

**UX-DR10** (admin interface):
- All form fields single-column, full-width
- `mat-snack-bar` 3-second auto-dismiss for save confirmation
- `mat-slide-toggle` for Sélection du mois flag (not a checkbox)

**UX-DR12** (field order — CRITICAL, do not reorder):
- ISBN → Titre → Auteur(s) → Genre/Catégorie → Année de publication → Couverture (URL) → Note du curateur → Sélection du mois
- ISBN field: `type="text"` plain text input — pre-wired for Epic 6 ISBN barcode scan integration

**UX-DR13** (navigation & focus):
- After save: `router.navigate(['/admin'])` — explicit navigation, never `window.history.back()`
- "Annuler" button: `routerLink="/admin"` — goes to list, never history-based

**UX-DR16** (button hierarchy):
- "Enregistrer": `mat-raised-button color="primary"` (terracotta) — single primary action per screen
- "Annuler": `mat-stroked-button` (secondary, no color attribute)

### Backend API Contract Reference

**POST /books** (JWT required):
```
Body: { isbn, title, author, genre, publicationYear, coverImageUrl?, curatorNote?, isSelectionDuMois }
Response 201: BookDto — backend auto-sets DateAdded = UtcNow, Status = "available"
```

**PUT /books/{id}** (JWT required):
```
Body: { isbn, title, author, genre, publicationYear, coverImageUrl?, curatorNote?, isSelectionDuMois, status }
Response 200: BookDto (updated)
Response 404: ProblemDetails (book not found)
```

**Important:** Backend performs HTTP HEAD check on `coverImageUrl` before storage. If URL is broken, backend stores `null`. The frontend save call still succeeds (200/201); `coverImageUrl` in response may be `null` even if a URL was submitted. This is expected — no error to show.

### Previous Story Intelligence

From Story 5.2 (Admin Book List View — in review):
- Route to `/admin/livres/:id/modifier` is already wired — activated from `onEditClick(book)` in `BookList`
- Route to `/admin/livres/nouveau` is already wired — activated from the FAB "Ajouter un livre"
- `onDeleteClick(_book: Book): void {}` stub in `BookList` is intentionally empty — Story 5.4 implements it; do NOT touch `book-list.ts`
- `isLoading = signal(true)` / `signal(false)` pattern confirmed working in `BookList`
- `standalone: true` + `inject()` pattern confirmed working

From Story 5.1 (Book CRUD API — in review):
- `POST /books` and `PUT /books/{id}` are implemented and tested in backend
- `BookService.getById(id)` already works and is used by `BookList` indirectly via `getAll()`

### File Structure Notes

```
frontend/src/app/
  shared/
    models/
      book.model.ts           ← APPEND CreateBookRequest + UpdateBookRequest (after FilterCriteria)
    services/
      book.service.ts         ← ADD create() and update() methods + update import
  features/
    admin/
      book-form/
        book-form.ts          ← REPLACE stub with full standalone implementation
```

No spec files required for MVP.

### References

- Story 5.3 acceptance criteria: [_bmad-output/planning-artifacts/epics.md](_bmad-output/planning-artifacts/epics.md) (section "Story 5.3")
- Previous story 5.2: [_bmad-output/implementation-artifacts/5-2-admin-book-list-view.md](_bmad-output/implementation-artifacts/5-2-admin-book-list-view.md)
- Admin routes (already configured): [frontend/src/app/features/admin/admin.routes.ts](frontend/src/app/features/admin/admin.routes.ts)
- Book form stub to replace: [frontend/src/app/features/admin/book-form/book-form.ts](frontend/src/app/features/admin/book-form/book-form.ts)
- BookService (add create/update): [frontend/src/app/shared/services/book.service.ts](frontend/src/app/shared/services/book.service.ts)
- Book model (append interfaces): [frontend/src/app/shared/models/book.model.ts](frontend/src/app/shared/models/book.model.ts)
- Architecture (Reactive Forms, standalone patterns): [_bmad-output/planning-artifacts/architecture.md](_bmad-output/planning-artifacts/architecture.md)
- UX spec (admin form, snackbar, slide toggle): [_bmad-output/planning-artifacts/ux-design-specification.md](_bmad-output/planning-artifacts/ux-design-specification.md)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None

### Completion Notes List

- Task 1: Appended `CreateBookRequest` and `UpdateBookRequest` interfaces to `book.model.ts` after `FilterCriteria`. Updated `BookService` import and added `create()` (POST) and `update()` (PUT) methods.
- Task 2: Replaced 3-line stub in `book-form.ts` with full standalone component. Key: `standalone: true` added (required by `loadComponent`), all DI via `inject()`, Reactive Forms with `FormBuilder`, `signal()` for `isLoading`/`isSaving`, edit mode detects `id` param and pre-fills form, `getRawValue()` on submit, empty string → null conversion for nullable fields, `mat-snack-bar` 3s auto-dismiss, `router.navigate(['/admin'])` after save.
- Task 3: `ng build --configuration=development` passed with 0 errors, 0 warnings. `book-form` lazy chunk emitted (260.54 kB). Manual validation steps require user verification with a running backend.

### File List

- `frontend/src/app/shared/models/book.model.ts`
- `frontend/src/app/shared/services/book.service.ts`
- `frontend/src/app/features/admin/book-form/book-form.ts`

### Change Log

- 2026-04-23: Story 5.3 created — Add & Edit Book Form
- 2026-04-24: Story 5.3 implemented — Tasks 1 & 2 complete, ng build green; manual validation pending user

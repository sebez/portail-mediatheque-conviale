# Story 5.4: Delete Book with Confirmation Dialog

Status: review

## Story

As the library animator,
I want a confirmation dialog before a book is permanently deleted,
So that I never accidentally remove a book from the catalog with a misplaced tap.

## Acceptance Criteria

1. **Given** the admin taps the delete icon on a book, **when** the action is triggered, **then** a `mat-dialog` opens with title "Supprimer ce livre ?", the book's title in quotes in the body, and two buttons: "Annuler" (secondary, focused by default) and "Supprimer" (destructive red `#B00020`).

2. **Given** the admin taps "Annuler" or presses Escape, **when** the dialog closes, **then** no deletion occurs and focus returns to the delete icon button that triggered the dialog.

3. **Given** the admin taps "Supprimer", **when** `DELETE /api/books/{id}` returns 204, **then** the book is removed from the list without a page reload **and** a `mat-snack-bar` "Livre supprimé" appears and auto-dismisses after 3 seconds.

4. **Given** the admin taps "Supprimer" and the API returns an error, **when** the error is handled, **then** the dialog closes, the book remains in the list, and an inline error message is shown.

## Tasks / Subtasks

- [x] Task 1: Add `delete()` to Angular `BookService` (AC: #3, #4)
  - [x] Add `delete(id: number): Observable<void>` method — DELETE to `${apiUrl}/${id}`

- [x] Task 2: Create `ConfirmDeleteDialog` standalone component (AC: #1, #2)
  - [x] Create new file `frontend/src/app/features/admin/book-list/confirm-delete-dialog.ts`
  - [x] Implement standalone component with `mat-dialog-title`, `mat-dialog-content`, `mat-dialog-actions`
  - [x] Accept `{ id: number; title: string }` via `MAT_DIALOG_DATA`
  - [x] "Annuler" button: `mat-stroked-button`, `cdkFocusInitial` (focused on dialog open), `mat-dialog-close` (emits `undefined`)
  - [x] "Supprimer" button: `mat-button`, `color: #B00020` via inline style, closes dialog with `true`

- [x] Task 3: Implement `onDeleteClick` in `BookList` (AC: #1, #2, #3, #4)
  - [x] Inject `MatDialog` and `MatSnackBar` into `BookList`
  - [x] Add `MatSnackBarModule` to component `imports` (ConfirmDeleteDialog excluded — not referenced in template, dialog opened programmatically)
  - [x] Add `deleteError = signal<string | null>(null)` for inline error display
  - [x] Replace `onDeleteClick(_book: Book): void {}` stub — open `ConfirmDeleteDialog`, handle result
  - [x] On confirm + success: `books.update(list => list.filter(b => b.id !== book.id))`, show snackbar
  - [x] On confirm + error: `deleteError.set('Erreur lors de la suppression. Veuillez réessayer.')`
  - [x] On cancel: no mutation, focus auto-restored by Angular CDK (built-in)
  - [x] Add inline error display to template (`role="alert"`)
  - [x] Clear `deleteError` at the start of each new delete attempt

- [x] Task 4: Validation
  - [x] `ng build` in `frontend/` — 0 errors, 0 warnings
  - [ ] Manual: tap delete icon → dialog opens with correct title and book title in quotes
  - [ ] Manual: tap "Annuler" → no deletion, dialog closes, focus on delete button
  - [ ] Manual: press Escape → no deletion, dialog closes
  - [ ] Manual: tap "Supprimer" → book removed from list, snackbar "Livre supprimé" appears

## Dev Notes

### Scope: 3 files to modify, 1 new file

| Action | File | Notes |
|--------|------|-------|
| Add `delete()` method | `frontend/src/app/shared/services/book.service.ts` | Only addition; all existing methods unchanged |
| New dialog component | `frontend/src/app/features/admin/book-list/confirm-delete-dialog.ts` | NEW FILE — co-located with book-list |
| Implement delete flow | `frontend/src/app/features/admin/book-list/book-list.ts` | Replace stub, add dialog + snackbar + error |

No new routes. No backend changes. Backend `DELETE /books/{id}` is already implemented.

### What ALREADY EXISTS — DO NOT Recreate

| File | What's already there |
|------|----------------------|
| `backend/Controllers/BooksController.cs` | `DELETE /books/{id}` endpoint — returns 204 on success, 404 ProblemDetails if not found — **NO CHANGES NEEDED** |
| `backend/Services/BookService.cs` | `DeleteAsync(int id)` — removes from DB and returns bool — **NO CHANGES NEEDED** |
| `frontend/src/app/features/admin/book-list/book-list.ts` | `onDeleteClick(_book: Book): void {}` stub at line 146 — REPLACE this stub only; all other methods and template unchanged |
| `frontend/src/app/shared/services/book.service.ts` | `getAll()`, `getById()`, `getFiltered()`, `create()`, `update()` — only ADD `delete()` |
| `frontend/src/app/features/admin/admin.routes.ts` | No changes needed — delete is an in-place dialog, not a new route |

### Task 1: `delete()` in Angular BookService

Add one method after `update()` in `frontend/src/app/shared/services/book.service.ts`:

```typescript
delete(id: number): Observable<void> {
  return this.http.delete<void>(`${this.apiUrl}/${id}`);
}
```

No import changes needed — `Observable` is already imported.

### Task 2: `ConfirmDeleteDialog` — Full Implementation

Create **new file** `frontend/src/app/features/admin/book-list/confirm-delete-dialog.ts`:

```typescript
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { A11yModule } from '@angular/cdk/a11y';

@Component({
  selector: 'app-confirm-delete-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, A11yModule],
  template: `
    <h2 mat-dialog-title>Supprimer ce livre ?</h2>
    <mat-dialog-content>
      <p>Vous êtes sur le point de supprimer "{{ data.title }}".</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button cdkFocusInitial mat-dialog-close>Annuler</button>
      <button mat-button style="color: #B00020" (click)="onConfirm()">Supprimer</button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDeleteDialog {
  readonly data = inject<{ id: number; title: string }>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<ConfirmDeleteDialog>);

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
```

**Critical notes:**
- `cdkFocusInitial` requires `A11yModule` from `@angular/cdk/a11y` — already available in the project (CDK is an Angular Material peer dependency)
- `mat-dialog-close` on "Annuler" closes the dialog and emits `undefined` (falsy) — no deletion triggered
- `dialogRef.close(true)` on "Supprimer" emits `true` — signals delete confirmed
- `style="color: #B00020"` sets destructive red per UX-DR11 — never use `color="warn"` (wrong shade)
- `align="end"` on `mat-dialog-actions` — standard Material dialog button placement

### Task 3: `BookList` Updates

**Imports to add to `book-list.ts`:**

```typescript
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDeleteDialog } from './confirm-delete-dialog';
```

**Component decorator `imports` array additions:**

```typescript
imports: [
  // ...existing imports unchanged...
  MatSnackBarModule,      // ← ADD
  ConfirmDeleteDialog,    // ← ADD
],
```

**New injections to add to the class body (after `private router`):**

```typescript
private dialog = inject(MatDialog);
private snackBar = inject(MatSnackBar);
```

**New signal to add:**

```typescript
deleteError = signal<string | null>(null);
```

**Replace stub `onDeleteClick`:**

```typescript
onDeleteClick(book: Book): void {
  this.deleteError.set(null);
  const dialogRef = this.dialog.open(ConfirmDeleteDialog, {
    data: { id: book.id, title: book.title },
  });

  dialogRef.afterClosed().subscribe(confirmed => {
    if (!confirmed) return;
    this.bookService.delete(book.id).subscribe({
      next: () => {
        this.books.update(list => list.filter(b => b.id !== book.id));
        this.snackBar.open('Livre supprimé', undefined, { duration: 3000 });
      },
      error: () => {
        this.deleteError.set('Erreur lors de la suppression. Veuillez réessayer.');
      },
    });
  });
}
```

**Add to template, inside `:host` block, after `</ul>` close tag and before the FAB button:**

```html
@if (deleteError()) {
  <p class="delete-error" role="alert">{{ deleteError() }}</p>
}
```

**Add to `styles` block:**

```scss
.delete-error {
  color: var(--color-error);
  padding: 8px 0;
  margin: 0;
  font-size: 14px;
}
```

### Architecture Compliance

- Standalone components with `inject()` pattern — no constructor DI
- `MatDialog` service injection in `BookList` — Angular Material Dialog for confirmation (UX-DR11 mandate)
- `dialogRef.afterClosed()` subscription — reactive, no imperative dialog management
- `books.update()` signal mutation — no full list reload; removes only deleted entry locally
- `mat-snack-bar` 3-second auto-dismiss — UX-DR10 compliance
- No new routes added — dialog is inline; no navigation required
- HTTP interceptor attaches JWT automatically — no auth code in component
- `router.navigate` NOT used post-delete — list stays on screen, only item removed

### UX Compliance Notes

**UX-DR11** (deletion confirmation dialog — CRITICAL):
- `mat-dialog` required — never allow direct deletion without this dialog
- Title: exactly "Supprimer ce livre ?" (with space before ?)
- Body: book title in quotes — `"{{ data.title }}"`
- Buttons: "Annuler" (secondary/stroked, focused by default) | "Supprimer" (destructive `#B00020`)
- "Supprimer" must NOT be default-focused — accidental tap prevention

**UX-DR13** (focus management):
- Angular CDK Dialog automatically restores focus to the element that triggered `dialog.open()` when dialog closes
- No manual `ElementRef` tracking needed — CDK handles it
- After successful delete: focus naturally moves to the next delete button or FAB (browser default)

**UX-DR10** (admin interface patterns):
- `mat-snack-bar` with message "Livre supprimé", `undefined` action label, 3000ms duration
- Same pattern as snackbar in `book-form.ts` — maintain consistency

**UX-DR16** (button hierarchy in dialog):
- "Supprimer" uses `mat-button` (ghost) not `mat-raised-button` — destructive actions use ghost style per spec
- "Annuler" uses `mat-stroked-button` (secondary)
- No primary button in dialog — one primary `mat-raised-button` per *screen* max, dialog is not a screen

### Backend API Contract Reference

**DELETE /books/{id}** (JWT required — `[Authorize]` on controller):
```
Response 204: No body — deletion successful
Response 404: ProblemDetails — book not found (already deleted)
Response 401: No JWT or expired JWT
```

The `BookService.DeleteAsync()` in the backend is fully implemented and tested. No backend changes required for this story.

Angular `Observable<void>` is correct for 204 — `HttpClient.delete<void>()` completes without emitting a value. The `next` callback fires with `undefined` on success.

### Critical Anti-Patterns to Avoid

| Anti-pattern | Correct pattern |
|---|---|
| Opening dialog inline without `mat-dialog` | Always use `MatDialog.open()` — never `window.confirm()` or custom DOM |
| `mat-raised-button color="warn"` for "Supprimer" | `mat-button` + `style="color: #B00020"` — exact shade per UX-DR11 |
| `cdkFocusInitial` on "Supprimer" button | Must be on "Annuler" — "Supprimer" must NEVER be default focus |
| Mutating `books()` list on dialog open | Mutate ONLY after `DELETE 204` response — not before, not on dialog confirm |
| Reloading full list via `getAll()` after delete | `books.update(list => list.filter(...))` — no round trip, no flicker |
| Not clearing `deleteError` before new attempt | `this.deleteError.set(null)` at start of `onDeleteClick` |
| `window.location.reload()` | Never — only local list mutation + snackbar |
| Forgetting `standalone: true` on `ConfirmDeleteDialog` | Dialog components loaded by `MatDialog.open()` must be standalone |
| Importing `MatDialogModule` in `book-list.ts` imports array | Not needed in book-list — only the dialog component itself needs it |

### Previous Story Intelligence

From Story 5.3 (Add & Edit Book Form — in review):
- `standalone: true` + `inject()` pattern confirmed working — same pattern here
- `mat-snack-bar` open pattern confirmed: `snackBar.open(msg, undefined, { duration: 3000 })` — identical usage
- `signal()` for reactive state confirmed working: `isLoading`, `isSaving`
- `router.navigate(['/admin'])` after save — no `window.history.back()`

From Story 5.2 (Admin Book List View — in review):
- `book-list.ts` `onDeleteClick(_book: Book): void {}` stub is at line 146 — this is the ONLY line to replace in the method body
- `books = signal<Book[]>([])` pattern established — use `this.books.update()` for local mutation
- `isLoading = signal(true)` pattern — note that `deleteError` should be `signal(null)` (falsy initial value)
- `BookList` already injects `BookService` and `Router` via `inject()` — add `MatDialog` and `MatSnackBar` using the same `inject()` pattern

From Story 5.1 (Book CRUD API — in review):
- `DELETE /books/{id}` is implemented, returns 204, uses `[Authorize]`
- HTTP interceptor in `app.config.ts` attaches JWT automatically — no auth code needed in component

### File Structure Notes

```
frontend/src/app/
  shared/
    services/
      book.service.ts           ← ADD delete() method only
  features/
    admin/
      book-list/
        book-list.ts            ← Replace stub onDeleteClick, add dialog+snackbar+error
        confirm-delete-dialog.ts  ← NEW FILE (standalone dialog component)
```

No spec files required for MVP.

### References

- Story 5.4 acceptance criteria: [_bmad-output/planning-artifacts/epics.md](_bmad-output/planning-artifacts/epics.md) (section "Story 5.4")
- Previous story 5.3: [_bmad-output/implementation-artifacts/5-3-add-and-edit-book-form.md](_bmad-output/implementation-artifacts/5-3-add-and-edit-book-form.md)
- BookList component (stub to implement): [frontend/src/app/features/admin/book-list/book-list.ts](frontend/src/app/features/admin/book-list/book-list.ts)
- BookService (add delete): [frontend/src/app/shared/services/book.service.ts](frontend/src/app/shared/services/book.service.ts)
- BooksController (DELETE already done): [backend/Controllers/BooksController.cs](backend/Controllers/BooksController.cs)
- Architecture (standalone, inject, signals): [_bmad-output/planning-artifacts/architecture.md](_bmad-output/planning-artifacts/architecture.md)
- UX spec (dialog, destructive button, snackbar): [_bmad-output/planning-artifacts/ux-design-specification.md](_bmad-output/planning-artifacts/ux-design-specification.md)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None

### Completion Notes List

- Task 1: Added `delete(id: number): Observable<void>` to `BookService` — single HTTP DELETE call, no import changes needed.
- Task 2: Created `ConfirmDeleteDialog` standalone component with `mat-dialog-title`, `mat-dialog-content`, `mat-dialog-actions`. "Annuler" uses `cdkFocusInitial` + `mat-dialog-close` (emits undefined). "Supprimer" closes with `true` and uses `style="color: #B00020"` per UX-DR11.
- Task 3: Replaced `onDeleteClick` stub in `BookList`. Injected `MatDialog` and `MatSnackBar`. Added `deleteError` signal. Dialog opened programmatically — `ConfirmDeleteDialog` excluded from template `imports` array (not referenced in template, would cause NG8113 warning). On success: local signal mutation + snackbar. On error: inline `deleteError` message.
- Task 4: `ng build` passes — 0 errors, 0 warnings. Manual testing required for dialog UX flows.

### File List

- `frontend/src/app/shared/services/book.service.ts` (modified — added `delete()` method)
- `frontend/src/app/features/admin/book-list/confirm-delete-dialog.ts` (new file)
- `frontend/src/app/features/admin/book-list/book-list.ts` (modified — delete flow implemented)

### Change Log

- 2026-04-24: Story 5.4 created — Delete Book with Confirmation Dialog
- 2026-04-24: Story 5.4 implemented — `delete()` added to BookService, `ConfirmDeleteDialog` component created, `onDeleteClick` stub replaced with full dialog+snackbar+error flow; `ng build` 0 errors 0 warnings

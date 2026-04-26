# Story 6.3: ISBN Auto-Fill Integration in the Admin Book Form

Status: ready-for-dev

## Story

As the library animator,
I want the book form to auto-fill all metadata fields when an ISBN is scanned or entered manually,
So that I can add a new book in under 60 seconds with minimal typing.

## Acceptance Criteria

1. **Given** the admin scans a barcode successfully **When** the ISBN is emitted to `BookForm` **Then** `isbn.service.ts` calls `GET /api/isbn/{isbn}` and shows a `mat-progress-spinner` inline during the request.

2. **Given** the API returns metadata (full or partial) **When** the form is populated **Then** all returned non-null fields are auto-filled into their respective form controls **And** each auto-filled field is highlighted with a `#F4E4DC` background for 2 seconds then normalizes **And** all fields remain fully editable after auto-fill **And** focus moves automatically to the "Note du curateur" field after auto-fill completes.

3. **Given** the API returns no data (all fields null) **When** the form handles the empty response **Then** only the ISBN field is populated; all other fields are empty and editable **And** a discreet banner appears: "Impossible de récupérer les métadonnées. Saisissez les informations manuellement." — no error thrown.

4. **Given** the admin enters an ISBN manually in the text field and taps "Rechercher" **When** the lookup runs **Then** the same auto-fill flow triggers — identical behavior to the scan path.

5. **Given** the complete flow: scan barcode → auto-fill → write curator note → tap "Enregistrer" **When** measured on a standard smartphone under normal network conditions **Then** the sequence completes in under 60 seconds.

## Tasks / Subtasks

- [ ] Task 1: Add Scanner button and Rechercher button to the ISBN row in `book-form.ts` (AC: #1, #4)
  - [ ] Add `#isbnInput` template ref to the ISBN `<input>` element
  - [ ] Add a `<button mat-stroked-button>` "Scanner" that sets `showScanner.set(true)`
  - [ ] Add a `<button mat-stroked-button>` "Rechercher" that calls `onLookupIsbn()` — disabled when `isIsbnLookingUp()` is true
  - [ ] Show inline `<mat-progress-spinner diameter="16">` inside the "Rechercher" button while `isIsbnLookingUp()` is true

- [ ] Task 2: Wire `IsbnScanOverlay` into `BookForm` (AC: #1, #3)
  - [ ] Add `showScanner = signal(false)` signal
  - [ ] Add `@if (showScanner()) { <app-isbn-scan-overlay ... /> }` at the end of the form template (outside the `<form>` tag, inside the host)
  - [ ] Bind `(isbnDetected)="onIsbnDetected($event)"` and `(manualEntryRequested)="onManualEntryRequested()"`
  - [ ] Import `IsbnScanOverlay` in the component's `imports` array

- [ ] Task 3: Implement `runIsbnLookup(isbn)` and related handlers (AC: #1, #2, #3, #4)
  - [ ] Inject `IsbnService` via `inject(IsbnService)`
  - [ ] Add `isIsbnLookingUp = signal(false)`, `autoFilledFields = signal<Set<string>>(new Set())`, `showLookupError = signal(false)`
  - [ ] Implement `onIsbnDetected(isbn: string)`: close overlay, set ISBN field value, call `runIsbnLookup(isbn)`
  - [ ] Implement `onManualEntryRequested()`: close overlay, `setTimeout(() => isbnInputRef()?.nativeElement.focus())`
  - [ ] Implement `onLookupIsbn()`: read `form.get('isbn')?.value?.trim()`, call `runIsbnLookup()` if non-empty
  - [ ] Implement `runIsbnLookup(isbn)`: set `isIsbnLookingUp(true)`, call `isbnService.lookup(isbn).subscribe(...)`:
    - On next: patch non-null fields only (title, author, genre, publicationYear, coverImageUrl), track which in `autoFilledFields`, after 2s clear set and focus curatorNote; if no fields filled show `showLookupError`
    - On error: `isIsbnLookingUp(false)`, `showLookupError(true)`

- [ ] Task 4: Add auto-fill field highlighting (AC: #2)
  - [ ] Add `[class.isbn-auto-filled]="autoFilledFields().has('title')"` (etc.) to each `mat-form-field`
  - [ ] Add CSS: `.isbn-auto-filled ::ng-deep input, .isbn-auto-filled ::ng-deep textarea { background: #F4E4DC; transition: background 2s ease; }`
  - [ ] After `autoFilledFields.set(new Set())` the CSS transition removes the background automatically

- [ ] Task 5: Add error banner and focus on curatorNote (AC: #2, #3)
  - [ ] Add `#curatorNoteInput` template ref to the `<textarea>` for curatorNote
  - [ ] Add `viewChild<ElementRef<HTMLTextAreaElement>>('curatorNoteInput')` in class
  - [ ] After 2s highlight: `this.curatorNoteRef()?.nativeElement.focus()`
  - [ ] Add `@if (showLookupError())` banner with terracotta-tinted style: "Impossible de récupérer les métadonnées. Saisissez les informations manuellement."

- [ ] Task 6: Write unit tests (AC: all)
  - [ ] Create `frontend/src/app/features/admin/book-form/book-form.spec.ts`
  - [ ] Mock `IsbnService` with `vi.fn()` returning `of(partialBook)` or `of({})` as needed
  - [ ] Mock `BookService` and `ActivatedRoute` (no bookId for add mode)
  - [ ] Test: Scanner button click sets `showScanner` to true
  - [ ] Test: `onIsbnDetected('9780374275631')` → closes overlay, sets ISBN field, calls isbn.service.lookup
  - [ ] Test: `onManualEntryRequested()` → closes overlay
  - [ ] Test: `runIsbnLookup` with full data → patches form, sets `autoFilledFields`
  - [ ] Test: `runIsbnLookup` with empty data → `showLookupError` is true
  - [ ] Test: "Rechercher" button calls `onLookupIsbn()`

- [ ] Task 7: Validation
  - [ ] `ng build` passes — 0 errors
  - [ ] `ng test` passes — no regressions (currently 57 tests)
  - [ ] Manual: scan ISBN → overlay opens → barcode detected → overlay closes → form auto-filled → fields highlighted 2s → focus on curatorNote
  - [ ] Manual: type ISBN → tap Rechercher → spinner → form auto-filled
  - [ ] Manual: both APIs down (mock) → banner appears, form submittable

## Dev Notes

### Scope: 1 file modified, 1 new test file

| Action | File | Notes |
|--------|------|-------|
| MODIFY | `frontend/src/app/features/admin/book-form/book-form.ts` | Add scanner button, overlay, auto-fill logic |
| NEW | `frontend/src/app/features/admin/book-form/book-form.spec.ts` | Unit tests |

**NO backend changes. NO route changes. NO new components.**

### What ALREADY EXISTS — DO NOT recreate

| File | What's already there |
|------|----------------------|
| `frontend/src/app/features/admin/book-form/book-form.ts` | Full CRUD form — ISBN, title, author, genre, publicationYear, coverImageUrl, curatorNote, isSelectionDuMois; Reactive Forms with `form.patchValue()`; `inject()` DI; `signal()` state; `MatProgressSpinnerModule` already imported |
| `frontend/src/app/shared/components/isbn-scan-overlay/isbn-scan-overlay.ts` | `IsbnScanOverlay` component — selector `app-isbn-scan-overlay`; `@Output() isbnDetected = new EventEmitter<string>()`; `@Output() manualEntryRequested = new EventEmitter<void>()` |
| `frontend/src/app/shared/services/isbn.service.ts` | `lookup(isbn): Observable<Partial<Book>>` calling `GET /api/isbn/{isbn}` — just inject and call |
| Backend `IsbnController` | Fully implemented and registered in DI — no changes |

### Current `book-form.ts` Structure (Study Before Modifying)

```typescript
// Current imports in book-form.ts:
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';  // ← ALREADY THERE
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BookService } from '../../../shared/services/book.service';

// Current signals:
isLoading = signal(false);   // used for edit-mode loading
isSaving = signal(false);    // used for form submit spinner

// Current form:
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
```

### Full Implementation Reference

Add these imports to `book-form.ts`:

```typescript
import { Component, inject, OnInit, signal, viewChild, ElementRef } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { IsbnScanOverlay } from '../../../shared/components/isbn-scan-overlay/isbn-scan-overlay';
import { IsbnService } from '../../../shared/services/isbn.service';
```

Add to `imports` array in `@Component`:
```typescript
imports: [
  // ...existing...
  MatIconModule,
  IsbnScanOverlay,
]
```

New class members (add after existing signals):
```typescript
private isbnService = inject(IsbnService);

showScanner = signal(false);
isIsbnLookingUp = signal(false);
autoFilledFields = signal<Set<string>>(new Set());
showLookupError = signal(false);

private isbnInputRef = viewChild<ElementRef<HTMLInputElement>>('isbnInput');
private curatorNoteRef = viewChild<ElementRef<HTMLTextAreaElement>>('curatorNoteInput');
```

New methods:
```typescript
onOpenScanner(): void {
  this.showScanner.set(true);
}

onIsbnDetected(isbn: string): void {
  this.showScanner.set(false);
  this.form.get('isbn')?.setValue(isbn);
  this.runIsbnLookup(isbn);
}

onManualEntryRequested(): void {
  this.showScanner.set(false);
  setTimeout(() => this.isbnInputRef()?.nativeElement.focus());
}

onLookupIsbn(): void {
  const isbn = this.form.get('isbn')?.value?.trim();
  if (isbn) this.runIsbnLookup(isbn);
}

private runIsbnLookup(isbn: string): void {
  this.isIsbnLookingUp.set(true);
  this.showLookupError.set(false);
  this.isbnService.lookup(isbn).subscribe({
    next: (data) => {
      this.isIsbnLookingUp.set(false);
      const filled = new Set<string>();
      const patch: Record<string, unknown> = {};

      if (data.title) { patch['title'] = data.title; filled.add('title'); }
      if (data.author) { patch['author'] = data.author; filled.add('author'); }
      if (data.genre) { patch['genre'] = data.genre; filled.add('genre'); }
      if (data.publicationYear) { patch['publicationYear'] = data.publicationYear; filled.add('publicationYear'); }
      if (data.coverImageUrl) { patch['coverImageUrl'] = data.coverImageUrl; filled.add('coverImageUrl'); }

      if (filled.size === 0) {
        this.showLookupError.set(true);
        return;
      }

      this.form.patchValue(patch);
      this.autoFilledFields.set(filled);

      setTimeout(() => {
        this.autoFilledFields.set(new Set());
        this.curatorNoteRef()?.nativeElement.focus();
      }, 2000);
    },
    error: () => {
      this.isIsbnLookingUp.set(false);
      this.showLookupError.set(true);
    },
  });
}
```

### Template Changes

Replace the ISBN `mat-form-field` block with:

```html
<!-- ISBN row: field + Rechercher + Scanner -->
<div class="isbn-row">
  <mat-form-field appearance="outline" class="isbn-field">
    <mat-label>ISBN</mat-label>
    <input matInput #isbnInput formControlName="isbn" type="text" autocomplete="off" />
    @if (form.get('isbn')?.invalid && form.get('isbn')?.touched) {
      <mat-error>L'ISBN est requis</mat-error>
    }
  </mat-form-field>

  <button mat-stroked-button type="button"
          (click)="onLookupIsbn()"
          [disabled]="isIsbnLookingUp()">
    @if (isIsbnLookingUp()) {
      <mat-progress-spinner diameter="16" mode="indeterminate" />
    } @else {
      Rechercher
    }
  </button>

  <button mat-stroked-button type="button" (click)="onOpenScanner()">
    <mat-icon>qr_code_scanner</mat-icon>
    Scanner
  </button>
</div>

@if (showLookupError()) {
  <div class="lookup-error-banner">
    Impossible de récupérer les métadonnées. Saisissez les informations manuellement.
  </div>
}
```

Add `[class.isbn-auto-filled]` to each relevant `mat-form-field` (title, author, genre, publicationYear, coverImageUrl):

```html
<mat-form-field appearance="outline" [class.isbn-auto-filled]="autoFilledFields().has('title')">
  <mat-label>Titre</mat-label>
  <input matInput formControlName="title" />
  ...
</mat-form-field>
```

Add `#curatorNoteInput` to the textarea:
```html
<mat-form-field appearance="outline">
  <mat-label>Note du curateur</mat-label>
  <textarea matInput #curatorNoteInput formControlName="curatorNote" rows="5"></textarea>
</mat-form-field>
```

Add scanner overlay OUTSIDE the `<form>` element (but inside the `@else` block):
```html
@if (showScanner()) {
  <app-isbn-scan-overlay
    (isbnDetected)="onIsbnDetected($event)"
    (manualEntryRequested)="onManualEntryRequested()"
  />
}
```

### CSS Additions

Add to `styles: [...]` in the component:

```css
.isbn-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.isbn-field {
  flex: 1;
}

.lookup-error-banner {
  background: #FFF3CD;
  border: 1px solid #FFC107;
  border-radius: 4px;
  padding: 10px 14px;
  font-size: 13px;
  color: #856404;
  margin-bottom: 4px;
}

.isbn-auto-filled ::ng-deep .mat-mdc-form-field-input-control {
  background: #F4E4DC;
  transition: background 2s ease;
}
```

### Architecture Compliance

- **Standalone component** — keep `standalone: true` (already set)
- **`inject()` for DI** — `inject(IsbnService)` matches all other services in this file
- **`signal()` for reactive state** — all new state as signals (consistent with `isLoading`, `isSaving`)
- **`viewChild()` signal** — Angular 17+ API for template refs, no `@ViewChild` decorator needed
- **`form.patchValue()`** — the established pattern in edit mode; same approach for auto-fill
- **No new routes** — overlay is rendered inline, no routing change
- **`MatIconModule`** — add to `imports` array; `qr_code_scanner` icon is from Material Symbols (already loaded globally)
- **File naming** — `book-form.ts` (no `.component.` infix), `book-form.spec.ts` — matches project convention
- **IsbnScanOverlay import path** — `'../../../shared/components/isbn-scan-overlay/isbn-scan-overlay'`

### Testing Notes

Test file: `frontend/src/app/features/admin/book-form/book-form.spec.ts`

Pattern from previous tests in this project (Vitest + Angular):
- Use `vi.fn()` and `vi.spyOn()` — not Jest mocks
- `provideAnimationsAsync()` in providers
- Mock `ActivatedRoute` with `snapshot.paramMap.get` returning `null` (add mode)
- Mock `IsbnService.lookup` with `vi.fn().mockReturnValue(of({...}))`
- Mock `BookService` with `vi.fn()` stubs

```typescript
// frontend/src/app/features/admin/book-form/book-form.spec.ts
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { BookForm } from './book-form';
import { BookService } from '../../../shared/services/book.service';
import { IsbnService } from '../../../shared/services/isbn.service';

const mockActivatedRoute = {
  snapshot: { paramMap: { get: () => null } },  // add mode, no id
};

const mockBookService = {
  getById: vi.fn(),
  create: vi.fn().mockReturnValue(of({})),
  update: vi.fn().mockReturnValue(of({})),
};

const mockIsbnService = {
  lookup: vi.fn(),
};

describe('BookForm — ISBN auto-fill (Story 6.3)', () => {
  let fixture: ComponentFixture<BookForm>;
  let component: BookForm;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookForm],
      providers: [
        provideAnimationsAsync(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: BookService, useValue: mockBookService },
        { provide: IsbnService, useValue: mockIsbnService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BookForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => vi.clearAllMocks());

  it('should show scanner overlay when Scanner button clicked', () => {
    expect(component.showScanner()).toBe(false);
    const btn = fixture.nativeElement.querySelector('button[type="button"]') as HTMLButtonElement;
    // Find "Scanner" button specifically
    component.onOpenScanner();
    expect(component.showScanner()).toBe(true);
    fixture.detectChanges();
    const overlay = fixture.nativeElement.querySelector('app-isbn-scan-overlay');
    expect(overlay).toBeTruthy();
  });

  it('onIsbnDetected should close overlay, set ISBN, and trigger lookup', () => {
    mockIsbnService.lookup.mockReturnValue(of({ title: 'Test Book', author: 'Test Author' }));
    component.showScanner.set(true);

    component.onIsbnDetected('9780374275631');

    expect(component.showScanner()).toBe(false);
    expect(component.form.get('isbn')?.value).toBe('9780374275631');
    expect(mockIsbnService.lookup).toHaveBeenCalledWith('9780374275631');
  });

  it('onManualEntryRequested should close overlay', () => {
    component.showScanner.set(true);
    component.onManualEntryRequested();
    expect(component.showScanner()).toBe(false);
  });

  it('runIsbnLookup with full data should patch form and set autoFilledFields', fakeAsync(() => {
    mockIsbnService.lookup.mockReturnValue(of({
      title: 'Leaves of Grass',
      author: 'Walt Whitman',
      genre: 'Poetry',
      publicationYear: 1990,
      coverImageUrl: 'https://example.com/cover.jpg',
    }));

    component.onLookupIsbn();  // isbn field is empty, nothing should happen
    expect(mockIsbnService.lookup).not.toHaveBeenCalled();

    component.form.get('isbn')?.setValue('9780374275631');
    component.onLookupIsbn();
    fixture.detectChanges();

    expect(component.form.get('title')?.value).toBe('Leaves of Grass');
    expect(component.form.get('author')?.value).toBe('Walt Whitman');
    expect(component.autoFilledFields().has('title')).toBe(true);
    expect(component.showLookupError()).toBe(false);

    tick(2000);
    expect(component.autoFilledFields().size).toBe(0);
  }));

  it('runIsbnLookup with empty data should show error banner', fakeAsync(() => {
    mockIsbnService.lookup.mockReturnValue(of({}));  // no metadata
    component.form.get('isbn')?.setValue('0000000000');
    component.onLookupIsbn();
    fixture.detectChanges();

    expect(component.showLookupError()).toBe(true);
    const banner = fixture.nativeElement.querySelector('.lookup-error-banner');
    expect(banner?.textContent).toContain('Impossible de récupérer');
  }));

  it('runIsbnLookup on HTTP error should show error banner', fakeAsync(() => {
    mockIsbnService.lookup.mockReturnValue(throwError(() => new Error('Network error')));
    component.form.get('isbn')?.setValue('9780000000000');
    component.onLookupIsbn();
    fixture.detectChanges();

    expect(component.showLookupError()).toBe(true);
    expect(component.isIsbnLookingUp()).toBe(false);
  }));
});
```

**Note:** `EventEmitter.subscribe()` is unreliable in this Vitest+zoneless env (from Story 6.2 learnings). For output testing, use `vi.spyOn(emitter, 'emit')`. For internal method calls, use `vi.spyOn(component, 'methodName' as any)`.

### Previous Story Intelligence

From Story 6.2 (`isbn-scan-overlay.ts` — now in review):
- `IsbnScanOverlay` has selector `app-isbn-scan-overlay`, `@Output() isbnDetected = new EventEmitter<string>()`, `@Output() manualEntryRequested = new EventEmitter<void>()`
- The overlay manages its own camera lifecycle — `BookForm` does NOT interact with camera at all
- When scanner emits `isbnDetected(isbn)` → the overlay is already stopped/cleaned up internally (1s success flash completed) — safe to immediately `showScanner.set(false)`
- **Test discovery:** `EventEmitter.subscribe()` unreliable in Vitest+zoneless — use `vi.spyOn(emitter, 'emit')` instead
- **Test discovery:** use `vi.advanceTimersByTime()` (sync) rather than async tick for timer-based tests

From Story 6.1 (backend — now in review):
- Backend returns `IsbnLookupDto`: `{ isbn, title?, author?, genre?, publicationYear?, coverImageUrl? }` — all nullable except `isbn`
- `GET /api/isbn/{isbn}` is `[Authorize]` — Angular auth interceptor (Story 4.2) already attaches JWT automatically
- Empty response = `{ isbn: "..." }` with all other fields `null` — `isbnService.lookup()` returns `Partial<Book>` which maps cleanly

From Story 5.3 (`book-form.ts` — established patterns):
- `inject()` for all DI — no constructor DI in this file
- `signal()` for all reactive state — consistent
- `form.patchValue({...})` already used in edit mode (line 163) — reuse exact same pattern for auto-fill
- `MatProgressSpinnerModule` already in imports — reuse for ISBN lookup spinner (no new import needed)

### NFR Compliance

- **NFR4** (60-second add flow): Lookup adds max 10s (5s OL + 5s GB) — within budget
- **NFR10/NFR11** (API unavailability non-blocking): lookup error → banner shown, form fully submittable; no field is disabled
- **NFR9** (accessibility): scanner overlay has `role="dialog"` and `aria-live` — already covered in 6.2

### File Structure

```
frontend/src/app/
  features/
    admin/
      book-form/
        book-form.ts         ← MODIFY
        book-form.spec.ts    ← NEW
```

No other files. No routing changes. No backend changes. No shared component changes.

### Anti-Patterns to Avoid

| Anti-pattern | Correct pattern |
|---|---|
| Calling `isbnService.lookup()` directly from template | Call from `runIsbnLookup()` method only |
| Patching null/undefined values into form | Check `if (data.title)` before patching |
| Emitting `manualEntryRequested` from overlay still open | Overlay closes itself on `manualEntryRequested` — just `showScanner.set(false)` |
| Using `@ViewChild` decorator | Use `viewChild()` signal from `@angular/core` |
| Adding `HttpClientModule` | `provideHttpClient()` already in `app.config.ts` — never add to component imports |
| Importing `MatProgressSpinnerModule` again | Already in the imports array — adding again causes duplicate import warning |
| Making form fields `disabled` after auto-fill | All fields must remain fully editable (AC #2: "all fields remain fully editable") |
| Showing error banner on partial fill | Show error ONLY when `filled.size === 0` (no fields returned) |

### References

- Epic 6 story 6.3 requirements: [_bmad-output/planning-artifacts/epics.md](_bmad-output/planning-artifacts/epics.md) (section "Story 6.3")
- UX spec (auto-fill behavior, field order, highlights): [_bmad-output/planning-artifacts/ux-design-specification.md](_bmad-output/planning-artifacts/ux-design-specification.md) (section "Story 6.3")
- Architecture (integration flow, form pattern): [_bmad-output/planning-artifacts/architecture.md](_bmad-output/planning-artifacts/architecture.md)
- File to modify: [frontend/src/app/features/admin/book-form/book-form.ts](frontend/src/app/features/admin/book-form/book-form.ts)
- Scanner component: [frontend/src/app/shared/components/isbn-scan-overlay/isbn-scan-overlay.ts](frontend/src/app/shared/components/isbn-scan-overlay/isbn-scan-overlay.ts)
- ISBN service: [frontend/src/app/shared/services/isbn.service.ts](frontend/src/app/shared/services/isbn.service.ts)
- Story 6.2 (scanner implementation, test patterns): [_bmad-output/implementation-artifacts/6-2-isbn-scan-overlay-component-browser-barcode-scanner.md](_bmad-output/implementation-artifacts/6-2-isbn-scan-overlay-component-browser-barcode-scanner.md)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List

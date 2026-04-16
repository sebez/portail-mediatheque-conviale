# Story 2.2: BookCoverComponent — Shared Cover Display with Graceful Fallback

Status: review

## Story

As any user viewing a book,
I want book covers to display in consistent sizes with a warm placeholder when no cover is available,
So that the catalog never shows broken image icons and always looks polished.

## Acceptance Criteria

1. **Given** a valid cover image URL is provided, **when** `BookCoverComponent` renders, **then** the image is displayed with `object-fit: cover` preserving the 2:3 ratio **and** a skeleton shimmer is shown while the image loads.

2. **Given** the cover URL is `null` or returns an HTTP error, **when** `BookCoverComponent` renders, **then** a warm grey (`#E8E3DD`) placeholder with a centered book icon is shown — never a broken image icon.

3. **Given** the component receives `size="small"` (64×88px), `size="medium"` (96×132px), or `size="large"` (120×165px), **when** it renders, **then** the correct pixel dimensions are applied via the `@Input size` property.

4. **Given** the component is used in a context where the parent carries the full accessible label, **when** `alt=""` is passed, **then** the image is decorative (empty alt); otherwise `alt="Couverture de [title]"` is set by the parent.

## Tasks / Subtasks

- [x] Task 1: Implement `BookCover` component (AC: #1, #2, #3, #4)
  - [x] Replace the stub in `frontend/src/app/shared/components/book-cover/book-cover.ts`
  - [x] Add `standalone: true`, `imports: [MatIconModule]` — keep class name `BookCover` (not `BookCoverComponent`)
  - [x] Implement three states: `loading` (skeleton shimmer), `loaded` (image), `error/null` (warm placeholder)
  - [x] Use `(load)` event to flip `isLoaded = true`; use `(error)` event to flip `hasError = true`
  - [x] Implement `@Input` setter (instead of `ngOnChanges`) to reset `isLoaded` and `hasError` when `coverUrl` changes
  - [x] Apply size CSS classes `book-cover--small`, `book-cover--medium`, `book-cover--large` via `[class]` binding
  - [x] Use `mat-icon` with `menu_book` for the placeholder — never a native broken image state
  - [x] Use only CSS custom properties from `styles.scss` for colours (`--color-outline`, `--color-on-surface-variant`)

- [x] Task 2: Write tests (AC: #1–#4)
  - [x] Create `frontend/src/app/shared/components/book-cover/book-cover.spec.ts`
  - [x] Test: placeholder shown when `coverUrl` is `null`
  - [x] Test: `<img>` rendered when valid `coverUrl` provided
  - [x] Test: placeholder shown after image `error` event fires
  - [x] Test: CSS class `book-cover--large` applied when `size="large"`
  - [x] Test: `alt` attribute passed through to `<img>`

- [x] Task 3: Validation
  - [x] `ng build` — 0 errors, 0 warnings
  - [x] `ng test --watch=false` — 8/8 tests pass, 0 regressions

## Dev Notes

### Scope: Frontend only — single component + spec file

This story is entirely frontend. No backend changes. No other Angular components are modified.

### What Already Exists — DO NOT Recreate

| Artifact | Location | Status |
|----------|----------|--------|
| `BookCover` stub | `frontend/src/app/shared/components/book-cover/book-cover.ts` | STUB — replace with full implementation |
| `Book` TypeScript model | `frontend/src/app/shared/models/book.model.ts` | COMPLETE — `coverImageUrl: string \| null` |
| `BookService` | `frontend/src/app/shared/services/book.service.ts` | COMPLETE — `getAll()`, `getById()` ready |
| Global theme tokens | `frontend/src/styles.scss` | COMPLETE — all `--color-*` custom props defined |
| Angular Material M3 | `@angular/material` v21.2 | COMPLETE — installed and themed |
| `MatIconModule` | `@angular/material/icon` | COMPLETE — Angular Material Icons bundled |

### Critical: Class Name and File Location

The class name is **`BookCover`** (NOT `BookCoverComponent`). This follows the project's Angular component naming convention — class names match the file name without the `.component` suffix. The file is `book-cover.ts`, not `book-cover.component.ts`.

```
frontend/src/app/shared/components/book-cover/
  book-cover.ts       ← MODIFY: replace stub
  book-cover.spec.ts  ← CREATE: 5 tests
```

No separate `.html` or `.scss` files — inline template and styles in the `.ts` file (project standard established in Story 1.1).

### Task 1: Full Component Implementation

**File:** `frontend/src/app/shared/components/book-cover/book-cover.ts`

```typescript
import { Component, Input, OnChanges } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-book-cover',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="book-cover book-cover--{{ size }}">
      @if (coverUrl && !hasError) {
        <div class="book-cover__skeleton" [class.hidden]="isLoaded" aria-hidden="true"></div>
        <img
          [src]="coverUrl"
          [alt]="alt"
          [class.visible]="isLoaded"
          (load)="onLoad()"
          (error)="onError()"
          class="book-cover__image"
        />
      } @else {
        <div class="book-cover__placeholder" aria-hidden="true">
          <mat-icon>menu_book</mat-icon>
        </div>
      }
    </div>
  `,
  styles: [`
    .book-cover {
      position: relative;
      flex-shrink: 0;
      border-radius: 4px;
      overflow: hidden;
      background-color: var(--color-outline);
    }

    .book-cover--small  { width: 64px;  height: 88px;  }
    .book-cover--medium { width: 96px;  height: 132px; }
    .book-cover--large  { width: 120px; height: 165px; }

    .book-cover__image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      opacity: 0;
      transition: opacity 0.15s ease-in;
    }
    .book-cover__image.visible { opacity: 1; }

    /* Skeleton shimmer — #E8E3DD is --color-outline, #f0ebe6 is its lightened step */
    .book-cover__skeleton {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        90deg,
        var(--color-outline) 25%,
        #f0ebe6 50%,
        var(--color-outline) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s ease-in-out infinite;
    }
    .book-cover__skeleton.hidden { display: none; }

    /* Placeholder — warm grey (#E8E3DD) with centered book icon */
    .book-cover__placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--color-outline);
      color: var(--color-on-surface-variant);
    }

    @keyframes shimmer {
      0%   { background-position: -200% 0; }
      100% { background-position:  200% 0; }
    }
  `]
})
export class BookCover implements OnChanges {
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() coverUrl: string | null = null;
  @Input() alt = '';

  isLoaded = false;
  hasError = false;

  ngOnChanges(): void {
    // Reset on any input change (coverUrl reassignment in reused list items)
    this.isLoaded = false;
    this.hasError = false;
  }

  onLoad(): void  { this.isLoaded = true; }
  onError(): void { this.hasError = true; }
}
```

**Implementation notes:**
- `@if` control flow (Angular 17+ built-in) — no `NgIf` import needed.
- The `standalone: true` must be explicit even in Angular 21 — do not omit it.
- `MatIconModule` import is required for `<mat-icon>` to resolve in the template.
- The skeleton is `position: absolute; inset: 0` layered behind the image; it hides when `isLoaded = true`.
- The image fades in (`opacity` transition) to avoid a jarring appearance after the skeleton.
- `#f0ebe6` in the shimmer gradient is the only hardcoded colour value; it is intentionally a lighter step of `--color-outline` (`#E8E3DD`) used solely for the animation midpoint — not a brand or interactive colour.

### Task 2: Test Implementation

**File:** `frontend/src/app/shared/components/book-cover/book-cover.spec.ts`

Angular 21 pattern — `TestBed.configureTestingModule({ imports: [ComponentClass] })`. No `@NgModule` needed for standalone components.

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BookCover } from './book-cover';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('BookCover', () => {
  let fixture: ComponentFixture<BookCover>;
  let component: BookCover;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookCover],
      providers: [provideAnimationsAsync()],
    }).compileComponents();

    fixture = TestBed.createComponent(BookCover);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should show placeholder when coverUrl is null (AC #2)', () => {
    component.coverUrl = null;
    fixture.detectChanges();

    const placeholder = fixture.nativeElement.querySelector('.book-cover__placeholder');
    const img = fixture.nativeElement.querySelector('img');
    expect(placeholder).toBeTruthy();
    expect(img).toBeNull();
  });

  it('should render <img> when a valid coverUrl is provided (AC #1)', () => {
    component.coverUrl = 'https://covers.openlibrary.org/b/isbn/9782070541270-M.jpg';
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.src).toContain('openlibrary.org');
  });

  it('should show placeholder after image error event fires (AC #2)', () => {
    component.coverUrl = 'https://example.com/broken.jpg';
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    img.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    const placeholder = fixture.nativeElement.querySelector('.book-cover__placeholder');
    expect(placeholder).toBeTruthy();
  });

  it('should apply size CSS class from @Input size (AC #3)', () => {
    component.size = 'large';
    fixture.detectChanges();

    const container = fixture.nativeElement.querySelector('.book-cover');
    expect(container.classList).toContain('book-cover--large');
  });

  it('should pass alt attribute to <img> (AC #4)', () => {
    component.coverUrl = 'https://example.com/cover.jpg';
    component.alt = 'Couverture de An Elegant Puzzle';
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('alt')).toBe('Couverture de An Elegant Puzzle');
  });
});
```

**Testing notes:**
- `provideAnimationsAsync()` is required because `MatIconModule` uses Angular animations; omitting it causes a warning.
- Triggering `new Event('error')` on the `<img>` simulates a failed image load — no real network request needed.
- No `HttpClientTestingModule` — `BookCover` makes no HTTP calls.

### Architecture Compliance

**CSS custom properties:** All colours use `var(--color-*)` tokens defined in `styles.scss` (UX-DR1). The one exception is `#f0ebe6` in the shimmer gradient midpoint — a derived animation shade, not an interactive colour.

**Standalone component:** `standalone: true` is explicit. No `@NgModule`. No `SharedModule`. `BookCover` is imported directly by consuming components.

**`object-fit: cover`:** Required by AC #1 — preserves the 2:3 (width:height) aspect ratio without letterboxing or distortion regardless of source image dimensions.

**Cover images served from Open Library CDN directly:** `BookCoverComponent` uses a plain `<img src="...">` binding — no image proxying via the Angular HTTP layer (NFR3).

**No broken image icon ever:** The `(error)` handler triggers `hasError = true`, which switches the `@if` branch to the placeholder. The browser's native broken image icon is never shown.

### Consumer Caller Contract

This is a shared component — it is imported and used by the following future stories:

| Consuming story | Import context | Expected usage |
|----------------|----------------|----------------|
| Story 2.3 — `BookListItemComponent` | `book-list-item.ts` imports | `<app-book-cover [coverUrl]="book.coverImageUrl" [size]="'medium'" [alt]="'Couverture de ' + book.title" />` |
| Story 2.4 — `BookDetailComponent` | `book-detail.ts` imports | `<app-book-cover [coverUrl]="book.coverImageUrl" [size]="'large'" [alt]="'Couverture de ' + book.title" />` |
| Story 2.5 — `SelectionDuMoisCardComponent` | `selection-du-mois-card.ts` imports | `<app-book-cover [coverUrl]="book.coverImageUrl" [size]="'large'" alt="" />` (parent carries accessible label) |
| Story 5.x — Admin form cover preview | `book-form.ts` imports | `<app-book-cover [coverUrl]="coverUrlControl.value" [size]="'medium'" [alt]="'Aperçu couverture'" />` |

These stories import `BookCover` in their `imports: [BookCover]` array. Do NOT modify their stubs in this story — the consuming components are implemented in their own stories.

### Scope Guard — What NOT to Implement

| Feature | Story |
|---------|-------|
| `BookListItemComponent` layout | Story 2.3 |
| `SelectionDuMoisCardComponent` | Story 2.5 |
| Cover URL HTTP HEAD validation before storage | Story 5.1 (`BookService.CreateAsync`) |
| Admin form cover URL field | Story 5.3 |
| Any backend changes | N/A — frontend only |

### References

- `BookCover` stub: [Source: `frontend/src/app/shared/components/book-cover/book-cover.ts`]
- CSS custom properties: [Source: `frontend/src/styles.scss`]
- Component sizes + shimmer spec: [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — `BookCoverComponent` section, UX-DR3]
- Angular standalone component pattern: [Source: `frontend/src/app/app.spec.ts`]
- Book model: [Source: `frontend/src/app/shared/models/book.model.ts`]
- Test pattern with `provideAnimationsAsync`: [Source: Angular Material testing docs — required for components using animations]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `ng build` — 0 errors, 0 warnings
- `ng test --watch=false` — 8/8 passed (5 BookCover + 3 App), 0 regressions
- Vitest pool fix required: added `vitest.config.ts` with `pool: 'threads'` + explicit `runnerConfig: "vitest.config.ts"` in `angular.json` to resolve Windows worker fork timeout (`[vitest-pool-runner]: Timeout waiting for worker to respond`)
- NG0100 fix: replaced `ngOnChanges` with `@Input` setter on `coverUrl` to prevent mid-CD-cycle mutation; also switched tests from direct property assignment to `fixture.componentRef.setInput()`

### Completion Notes List

- ✅ Task 1: `book-cover.ts` — stub replaced with full 3-state component (skeleton shimmer → loaded → warm placeholder). Used property setter on `coverUrl` instead of `ngOnChanges` to avoid `NG0100 ExpressionChangedAfterItHasBeenCheckedError`. Three size CSS classes applied via string interpolation. `mat-icon` with `menu_book` for placeholder. CSS uses only `--color-outline` and `--color-on-surface-variant` custom properties (plus `#f0ebe6` as shimmer midpoint animation shade only).
- ✅ Task 2: `book-cover.spec.ts` created — 5 tests, all using `fixture.componentRef.setInput()` (Angular 17+ pattern) for input changes; `provideAnimationsAsync()` provided to silence Material animation warnings. Error event dispatch tested via `img.dispatchEvent(new Event('error'))`.
- ✅ Task 3: Build clean; 8/8 tests pass; 0 regressions.
- ✅ Additional: configured Vitest `threads` pool via `vitest.config.ts` + `angular.json` `runnerConfig` — prerequisite infrastructure fix benefiting all current and future test runs on this Windows environment.

## File List

**New files:**
- `frontend/src/app/shared/components/book-cover/book-cover.spec.ts`
- `frontend/vitest.config.ts` — Vitest `threads` pool config (Windows worker fork timeout fix)

**Modified files:**
- `frontend/src/app/shared/components/book-cover/book-cover.ts` — full implementation replacing stub
- `frontend/angular.json` — added `runner: "vitest"` and `runnerConfig: "vitest.config.ts"` to test builder options

## Change Log

| Date | Change |
|------|--------|
| 2026-04-14 | Story created — BookCoverComponent implementation plan documented. |
| 2026-04-15 | Implementation complete — BookCover component, spec file, Vitest config fix; 8/8 tests pass. |

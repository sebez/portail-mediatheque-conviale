# Story 6.2: IsbnScanOverlayComponent — Browser Barcode Scanner

Status: review

## Story

As the library animator,
I want to scan a book's ISBN barcode using my smartphone camera in the browser,
So that I don't have to type a 13-digit number manually.

## Acceptance Criteria

1. **Given** the admin taps the "Scanner" button in the book form **When** `IsbnScanOverlay` opens **Then** the overlay is full-screen (`position: fixed; inset: 0`) with an animated scan line and terracotta viewfinder corners **And** `getUserMedia` is requested only at this point — never on page load.

2. **Given** the device has a camera and the admin grants permission **When** a barcode is detected by `BarcodeDetector` Web API **Then** the overlay shows a green success flash with ✓ and the detected ISBN for 1 second, triggers device vibration if available, then closes automatically **And** the detected ISBN string is emitted via `isbnDetected`.

3. **Given** `BarcodeDetector` is not available (Safari iOS) **When** the component initializes **Then** ZXing-js (`@zxing/browser`) is used as the fallback scanner — same UX, transparent to the user.

4. **Given** the device has no camera or the admin denies camera permission **When** the overlay attempts `getUserMedia` **Then** an informative message is shown and `manualEntryRequested` is emitted automatically — no dead end.

5. **Given** 30 seconds elapse without a successful scan **When** the timeout triggers **Then** a discreet suggestion appears: "Difficultés ? Saisissez l'ISBN manuellement".

6. **Given** the "Saisir l'ISBN manuellement" secondary button **When** tapped at any time **Then** `manualEntryRequested` is emitted — the parent (Story 6.3) handles focus and overlay hide — no navigation away.

7. **Given** scan feedback events occur **When** rendered **Then** they are announced via `aria-live="polite"`.

## Tasks / Subtasks

- [x] Task 1: Install ZXing-js dependency (AC: #3)
  - [x] Run `npm install @zxing/browser` in `frontend/` — installs `@zxing/library` as a dependency automatically
  - [x] Confirm `@zxing/browser` appears in `frontend/package.json` dependencies

- [x] Task 2: Implement `IsbnScanOverlay` component (AC: #1–#7)
  - [x] Replace placeholder in `frontend/src/app/shared/components/isbn-scan-overlay/isbn-scan-overlay.ts`
  - [x] Keep selector `app-isbn-scan-overlay`, keep `@Output() isbnDetected = new EventEmitter<string>()`
  - [x] Add `@Output() manualEntryRequested = new EventEmitter<void>()`
  - [x] Full-screen overlay: `position: fixed; inset: 0; background: rgba(0,0,0,0.92); z-index: 1000`
  - [x] `<video>` element for camera feed, auto-play, muted, `playsinline` (required on iOS)
  - [x] Viewfinder: centered square with terracotta (`#B85C38`) animated corner borders (L-shaped SVG or CSS borders)
  - [x] Animated scan line: horizontal bar moving top→bottom in loop within viewfinder
  - [x] Guide text: "Pointez vers le code-barres ISBN"
  - [x] Secondary button: "Saisir l'ISBN manuellement" (`mat-stroked-button`)
  - [x] State machine with signals: `scanState = signal<'scanning'|'success'|'error'|'timeout-hint'>('scanning')`
  - [x] Success state: green overlay flash (`#386A20` background tint) + ✓ icon + ISBN text for 1 second, then emit `isbnDetected(isbn)` and call `stopCamera()`
  - [x] Error state: show "Impossible d'accéder à la caméra. Vérifiez les permissions." + auto-emit `manualEntryRequested` after 2 seconds
  - [x] 30-second timeout: use `setTimeout` in `ngOnInit`, show hint text, do NOT stop scanning
  - [x] `aria-live="polite"` region for all state feedback messages
  - [x] Implement `ngOnInit`: call `startCamera()` — detect BarcodeDetector vs ZXing, start video stream
  - [x] Implement `ngOnDestroy`: call `stopCamera()` — stop all media tracks, cancel animation frame, stop ZXing reader
  - [x] BarcodeDetector path: `requestAnimationFrame` loop calling `detector.detect(videoEl)` — scan for `ean_13`, `ean_8` formats
  - [x] ZXing path: `BrowserMultiFormatReader.decodeFromVideoDevice(undefined, videoEl, callback)` — store controls ref for cleanup
  - [x] `navigator.vibrate(200)` on success (wrapped in try/catch — not available on all browsers)

- [x] Task 3: Write unit tests (AC: all)
  - [x] Create `frontend/src/app/shared/components/isbn-scan-overlay/isbn-scan-overlay.spec.ts`
  - [x] Mock `navigator.mediaDevices.getUserMedia` to return a fake stream (via `vi.stubGlobal`)
  - [x] Test: overlay renders with `position: fixed` in scanning state (AC #1)
  - [x] Test: `isbnDetected` emitted with ISBN string after scan success (AC #2)
  - [x] Test: `manualEntryRequested` emitted when manual button clicked (AC #6)
  - [x] Test: error state shown and `manualEntryRequested` auto-emitted when getUserMedia fails (AC #4)
  - [x] Test: `aria-live="polite"` region exists (AC #7)

- [x] Task 4: Validation
  - [x] `ng build` passes — 0 errors (TypeScript strict, no `any` unless unavoidable for BarcodeDetector)
  - [x] `ng test` passes — no regressions in existing tests
  - [ ] Manual: open admin book form on Chrome/Android → tap "Scanner" → camera opens → scan ISBN barcode → overlay closes, ISBN emitted
  - [ ] Manual: open on Safari iOS → ZXing fallback used → same UX

## Dev Notes

### Scope: 1 file modified (placeholder replaced), 1 new test file, 1 new npm dependency

| Action | File | Notes |
|--------|------|-------|
| MODIFY | `frontend/src/app/shared/components/isbn-scan-overlay/isbn-scan-overlay.ts` | Replace placeholder with full implementation |
| NEW | `frontend/src/app/shared/components/isbn-scan-overlay/isbn-scan-overlay.spec.ts` | Unit tests |
| MODIFY | `frontend/package.json` | `@zxing/browser` added by `npm install` |

**NO changes** to `book-form.ts`, `isbn.service.ts`, routes, or any backend file. Integration into `BookForm` is Story 6.3.

### CRITICAL: ZXing-js Not Yet Installed

`@zxing/browser` is NOT in `frontend/package.json`. It must be installed before implementing:

```bash
cd frontend
npm install @zxing/browser
```

This adds `@zxing/browser` and its peer `@zxing/library` to dependencies. After install, verify `package.json` lists `"@zxing/browser"` before committing.

### What ALREADY EXISTS — DO NOT recreate

| File | What's already there |
|------|----------------------|
| `frontend/src/app/shared/components/isbn-scan-overlay/isbn-scan-overlay.ts` | Placeholder with selector, `@Output() isbnDetected`, comment-documented spec — **REPLACE content entirely** |
| `frontend/src/app/shared/services/isbn.service.ts` | `lookup(isbn)` calling `GET /api/isbn/{isbn}` — **NO changes in 6.2** (Story 6.3) |
| `frontend/src/app/features/admin/book-form/book-form.ts` | Full CRUD form — **NO changes in 6.2** (Story 6.3 adds scanner button and wires overlay) |
| Backend `IsbnController` + `IsbnService` | Fully implemented in Story 6.1 — not touched here |

### File Naming Convention

Architecture docs mention `isbn-scan-overlay.component.ts` but **the actual file is `isbn-scan-overlay.ts`** (no `.component.` infix). ALL other shared components follow this convention: `book-cover.ts`, `book-list-item.ts`, `filter-bar.ts`, `selection-du-mois-card.ts`. Do NOT rename the file or introduce a `.component.` suffix.

### Component Pattern — Angular 21 Standalone

Follow the established standalone component pattern:

```typescript
@Component({
  selector: 'app-isbn-scan-overlay',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],  // only what you need
  template: `...`,
  styles: [`...`],
})
export class IsbnScanOverlay implements OnInit, OnDestroy {
  @Output() isbnDetected = new EventEmitter<string>();
  @Output() manualEntryRequested = new EventEmitter<void>();
  // ...
}
```

**Use `inject()` and `signal()`** — consistent with `book-form.ts`:
```typescript
private destroyRef = inject(DestroyRef);  // optional — for takeUntilDestroyed
scanState = signal<'scanning' | 'success' | 'error' | 'timeout-hint'>('scanning');
detectedIsbn = signal<string>('');
```

**Do NOT use `@ViewChild`** for the `<video>` element — access via `ElementRef` or use `afterNextRender` + `viewChild` signal.

### Task 2: Full Implementation Reference

```typescript
import {
  Component, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef, signal
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BrowserMultiFormatReader } from '@zxing/browser';
import type { IScannerControls } from '@zxing/browser';

// BarcodeDetector is a Chromium-only Web API — declare minimal typing to avoid TS error
declare class BarcodeDetector {
  constructor(options: { formats: string[] });
  detect(target: HTMLVideoElement): Promise<Array<{ rawValue: string }>>;
}

type ScanState = 'scanning' | 'success' | 'error' | 'timeout-hint';

@Component({
  selector: 'app-isbn-scan-overlay',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div class="overlay" role="dialog" aria-modal="true" aria-label="Scanner ISBN">

      <!-- Camera video feed -->
      <video #video autoplay muted playsinline class="video-feed"></video>

      <!-- Viewfinder -->
      <div class="viewfinder">
        <div class="corner corner--tl"></div>
        <div class="corner corner--tr"></div>
        <div class="corner corner--bl"></div>
        <div class="corner corner--br"></div>
        @if (scanState() === 'scanning' || scanState() === 'timeout-hint') {
          <div class="scan-line"></div>
        }
      </div>

      <!-- Feedback region — always in DOM for aria-live -->
      <div aria-live="polite" class="sr-only">{{ ariaLiveMessage() }}</div>

      <!-- State: scanning -->
      @if (scanState() === 'scanning' || scanState() === 'timeout-hint') {
        <p class="guide-text">Pointez vers le code-barres ISBN</p>
        @if (scanState() === 'timeout-hint') {
          <p class="timeout-hint">Difficultés ? Saisissez l'ISBN manuellement</p>
        }
        <button mat-stroked-button class="manual-btn" (click)="onManualEntry()">
          Saisir l'ISBN manuellement
        </button>
      }

      <!-- State: success -->
      @if (scanState() === 'success') {
        <div class="success-flash">
          <mat-icon class="success-icon">check_circle</mat-icon>
          <p class="success-isbn">{{ detectedIsbn() }}</p>
        </div>
      }

      <!-- State: error (no camera) -->
      @if (scanState() === 'error') {
        <div class="error-state">
          <mat-icon>videocam_off</mat-icon>
          <p>Impossible d'accéder à la caméra. Vérifiez les permissions.</p>
        </div>
      }

    </div>
  `,
  styles: [`
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.92);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 24px;
      color: #fff;
    }

    .video-feed {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0.6;
    }

    /* Viewfinder */
    .viewfinder {
      position: relative;
      width: 240px;
      height: 240px;
      z-index: 2;
    }

    /* L-shaped terracotta corners */
    .corner {
      position: absolute;
      width: 28px;
      height: 28px;
      border-color: #B85C38;
      border-style: solid;
    }
    .corner--tl { top: 0;    left: 0;  border-width: 3px 0 0 3px; }
    .corner--tr { top: 0;    right: 0; border-width: 3px 3px 0 0; }
    .corner--bl { bottom: 0; left: 0;  border-width: 0 0 3px 3px; }
    .corner--br { bottom: 0; right: 0; border-width: 0 3px 3px 0; }

    /* Animated scan line */
    @keyframes scan {
      0%   { top: 0; }
      100% { top: calc(100% - 2px); }
    }
    .scan-line {
      position: absolute;
      left: 0;
      right: 0;
      height: 2px;
      background: #B85C38;
      animation: scan 1.8s linear infinite;
    }

    /* Feedback text */
    .guide-text   { position: relative; z-index: 2; font-size: 14px; text-align: center; padding: 0 24px; }
    .timeout-hint { position: relative; z-index: 2; font-size: 12px; opacity: 0.75; text-align: center; }
    .manual-btn   { position: relative; z-index: 2; color: #fff; border-color: rgba(255,255,255,0.6); }

    /* Success flash */
    .success-flash {
      position: absolute;
      inset: 0;
      background: rgba(56, 106, 32, 0.85);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      z-index: 3;
    }
    .success-icon { font-size: 64px; width: 64px; height: 64px; color: #fff; }
    .success-isbn { font-size: 18px; font-weight: 600; color: #fff; letter-spacing: 1px; }

    /* Error state */
    .error-state {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 24px;
      text-align: center;
    }

    /* Visually hidden — for aria-live */
    .sr-only {
      position: absolute;
      width: 1px; height: 1px;
      padding: 0; margin: -1px;
      overflow: hidden; clip: rect(0,0,0,0);
      border: 0;
    }
  `],
})
export class IsbnScanOverlay implements OnInit, OnDestroy {
  @Output() isbnDetected = new EventEmitter<string>();
  @Output() manualEntryRequested = new EventEmitter<void>();
  @ViewChild('video') private videoRef!: ElementRef<HTMLVideoElement>;

  scanState = signal<ScanState>('scanning');
  detectedIsbn = signal('');
  ariaLiveMessage = signal('');

  private mediaStream: MediaStream | null = null;
  private zxingControls: IScannerControls | null = null;
  private rafId: number | null = null;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private successTimeoutId: ReturnType<typeof setTimeout> | null = null;

  async ngOnInit(): Promise<void> {
    // 30-second timeout hint (AC #5)
    this.timeoutId = setTimeout(() => {
      if (this.scanState() === 'scanning') {
        this.scanState.set('timeout-hint');
        this.ariaLiveMessage.set('Difficultés ? Saisissez l\'ISBN manuellement');
      }
    }, 30_000);

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      const video = this.videoRef.nativeElement;
      video.srcObject = this.mediaStream;
      await video.play();

      if ('BarcodeDetector' in window) {
        this.startBarcodeDetector(video);
      } else {
        await this.startZxing(video);
      }
    } catch {
      // Permission denied or no camera (AC #4)
      this.scanState.set('error');
      this.ariaLiveMessage.set('Impossible d\'accéder à la caméra.');
      setTimeout(() => this.manualEntryRequested.emit(), 2_000);
    }
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  onManualEntry(): void {
    this.stopCamera();
    this.manualEntryRequested.emit();
  }

  private startBarcodeDetector(video: HTMLVideoElement): void {
    const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8'] });

    const loop = async () => {
      if (this.scanState() !== 'scanning' && this.scanState() !== 'timeout-hint') return;
      try {
        const barcodes = await detector.detect(video);
        if (barcodes.length > 0) {
          this.onScanSuccess(barcodes[0].rawValue);
          return;
        }
      } catch { /* frame not ready or detector error — continue */ }
      this.rafId = requestAnimationFrame(loop);
    };

    this.rafId = requestAnimationFrame(loop);
  }

  private async startZxing(video: HTMLVideoElement): Promise<void> {
    const reader = new BrowserMultiFormatReader();
    this.zxingControls = await reader.decodeFromVideoDevice(
      undefined,  // use default camera
      video,
      (result) => {
        if (result) {
          this.onScanSuccess(result.getText());
        }
      }
    );
  }

  private onScanSuccess(isbn: string): void {
    this.stopScanning();  // stop detection loop, keep video running briefly for flash
    this.detectedIsbn.set(isbn);
    this.scanState.set('success');
    this.ariaLiveMessage.set(`ISBN détecté : ${isbn}`);

    try { navigator.vibrate(200); } catch { /* not available on all browsers */ }

    this.successTimeoutId = setTimeout(() => {
      this.stopCamera();
      this.isbnDetected.emit(isbn);  // parent (6.3) closes overlay on this event
    }, 1_000);
  }

  private stopScanning(): void {
    if (this.rafId !== null) { cancelAnimationFrame(this.rafId); this.rafId = null; }
    if (this.zxingControls) { this.zxingControls.stop(); this.zxingControls = null; }
    if (this.timeoutId !== null) { clearTimeout(this.timeoutId); this.timeoutId = null; }
  }

  private stopCamera(): void {
    this.stopScanning();
    if (this.successTimeoutId !== null) { clearTimeout(this.successTimeoutId); this.successTimeoutId = null; }
    this.mediaStream?.getTracks().forEach(t => t.stop());
    this.mediaStream = null;
  }
}
```

### Task 3: Test Reference

```typescript
// frontend/src/app/shared/components/isbn-scan-overlay/isbn-scan-overlay.spec.ts

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { IsbnScanOverlay } from './isbn-scan-overlay';
import { vi } from 'vitest';

function makeFakeStream(): MediaStream {
  const track = { stop: vi.fn(), kind: 'video' } as unknown as MediaStreamTrack;
  return { getTracks: () => [track] } as unknown as MediaStream;
}

describe('IsbnScanOverlay', () => {
  let fixture: ComponentFixture<IsbnScanOverlay>;
  let component: IsbnScanOverlay;

  beforeEach(async () => {
    // Stub getUserMedia to return a fake stream
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue(makeFakeStream()),
      },
      vibrate: vi.fn(),
    });

    // Stub BarcodeDetector as unavailable (use ZXing path)
    // Or stub as available for BarcodeDetector path
    (window as any).BarcodeDetector = undefined;

    await TestBed.configureTestingModule({
      imports: [IsbnScanOverlay],
      providers: [provideAnimationsAsync()],
    }).compileComponents();

    fixture = TestBed.createComponent(IsbnScanOverlay);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fixture.destroy();
  });

  it('should render overlay with scanning state (AC #1)', () => {
    fixture.detectChanges();
    const overlay = fixture.nativeElement.querySelector('.overlay');
    expect(overlay).toBeTruthy();
    const guideText = fixture.nativeElement.querySelector('.guide-text');
    expect(guideText?.textContent).toContain('code-barres');
  });

  it('should have aria-live="polite" region (AC #7)', () => {
    fixture.detectChanges();
    const liveRegion = fixture.nativeElement.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeTruthy();
  });

  it('should emit manualEntryRequested when manual button clicked (AC #6)', () => {
    fixture.detectChanges();
    const emitted: void[] = [];
    component.manualEntryRequested.subscribe(() => emitted.push());
    const btn = fixture.nativeElement.querySelector('.manual-btn') as HTMLButtonElement;
    btn.click();
    expect(emitted).toHaveLength(1);
  });

  it('should emit isbnDetected after success flash (AC #2)', fakeAsync(() => {
    fixture.detectChanges();
    const isbns: string[] = [];
    component.isbnDetected.subscribe(v => isbns.push(v));

    // Trigger success directly
    (component as any).onScanSuccess('9780374275631');
    fixture.detectChanges();

    expect(component.scanState()).toBe('success');
    expect(component.detectedIsbn()).toBe('9780374275631');

    tick(1_000);  // success flash duration

    expect(isbns).toEqual(['9780374275631']);
  }));

  it('should show error state and auto-emit manualEntryRequested on getUserMedia failure (AC #4)',
    fakeAsync(async () => {
      vi.stubGlobal('navigator', {
        mediaDevices: {
          getUserMedia: vi.fn().mockRejectedValue(new Error('NotAllowedError')),
        },
      });

      const emitted: void[] = [];
      component.manualEntryRequested.subscribe(() => emitted.push());

      await component.ngOnInit();
      fixture.detectChanges();

      expect(component.scanState()).toBe('error');
      const errorEl = fixture.nativeElement.querySelector('.error-state');
      expect(errorEl).toBeTruthy();

      tick(2_000);  // auto-emit delay
      expect(emitted).toHaveLength(1);
    })
  );
});
```

**Note:** ZXing's `decodeFromVideoDevice` starts a video stream internally. In tests where `BarcodeDetector` is undefined, mock `BrowserMultiFormatReader` using `vi.mock('@zxing/browser')` if ZXing initialization causes test hangs. The `onScanSuccess` method is marked `private` but accessible via `(component as any).onScanSuccess(...)` for testing the success path.

### Architecture Compliance

- Standalone component — no NgModule (`standalone: true` always)
- `inject()` not used here because no Angular services are injected (no DI needed)
- `@ViewChild('video')` acceptable for DOM element reference (not an Angular-managed element)
- `signal()` for reactive state — consistent with Angular 21 pattern
- `MatButtonModule` + `MatIconModule` imported in component's `imports` array (not a SharedModule)
- Component file name: `isbn-scan-overlay.ts` — NO `.component.` infix (matches project convention)
- CSS class names: BEM-style `.isbn-scan-overlay__*` or flat `.overlay`, `.viewfinder` — follow what reads cleanly in an isolated component
- `position: fixed; inset: 0` — required by AC #1; `z-index: 1000` — above all existing UI
- `playsinline` attribute on `<video>` — required on iOS Safari for camera to work in-page (without going fullscreen)
- `facingMode: 'environment'` — requests rear camera (barcode scanning), falls back to any camera if unavailable

### NFR Compliance

- **NFR4** (60-second add flow): Component adds 0s if barcode detected immediately, max 30s before timeout hint — does not block the flow
- **NFR10/NFR11** (API unavailability non-blocking): Scanner failure emits `manualEntryRequested` — form stays fully usable
- **AC #4**: no camera → auto-switch to manual in 2 seconds — no dead end

### BarcodeDetector Web API Notes

`BarcodeDetector` is a Chromium 2024+ Web API — available in Chrome/Edge on Android/desktop. Not available on Safari iOS (use ZXing fallback) or Firefox.

Detection formats for ISBN barcodes: `['ean_13', 'ean_8']`. EAN-13 is the standard ISBN-13 format. Include `ean_8` for older ISBN-10 books that may use EAN-8.

TypeScript: Declare the class locally (see implementation reference above) or install `@types/wicg-barcode-detection` for full typing. Local declaration is lighter and avoids an extra dev dependency.

### ZXing-js Notes (`@zxing/browser`)

`BrowserMultiFormatReader` auto-handles EAN-13/EAN-8. The `decodeFromVideoDevice` method:
- First param `undefined` → uses the first available camera (rear if permission allows)
- Returns `IScannerControls` — call `controls.stop()` to stop scanning
- The callback fires for each successful decode — stop on first result to prevent multiple emits

ZXing auto-starts `getUserMedia` internally when using `decodeFromVideoDevice`. If you've already started the stream yourself (for BarcodeDetector path), do not call ZXing's `decodeFromVideoDevice` — just use `decodeOnceFromStream()` or similar instead, OR let ZXing manage the stream entirely. **Simplest approach**: let ZXing manage `getUserMedia` in the ZXing path (don't pre-call `getUserMedia` for ZXing), call `getUserMedia` only in the BarcodeDetector path.

### Story 6.3 Preview (DO NOT implement in 6.2)

Story 6.3 will:
- Add a "Scanner" button to `book-form.ts` that shows/hides `IsbnScanOverlay`
- Listen to `isbnDetected` output → call `isbn.service.ts` → patch form controls
- Listen to `manualEntryRequested` output → hide overlay, focus ISBN input
- Add `MatProgressSpinnerModule` inline during lookup
- Add `#isbnInput` template ref to the ISBN `mat-form-field`

None of this belongs in `isbn-scan-overlay.ts`. The component is a pure, self-contained scanner UI.

### Previous Story Intelligence

From Story 6.1 (backend, now in review):
- Angular `isbn.service.ts` is fully implemented: `lookup(isbn): Observable<Partial<Book>>` calling `GET /api/isbn/{isbn}` — will be used in 6.3
- Placeholder `isbn-scan-overlay.ts` was intentionally left unchanged in 6.1 — **this story replaces the placeholder entirely**
- The backend `IsbnController` is `[Authorize]` — no change needed; auth interceptor already attaches JWT

From Story 5.3 (admin book form):
- `book-form.ts` uses Reactive Forms (`FormBuilder`, `form.patchValue()`) — the scanner integration in 6.3 will use `form.patchValue()` to auto-fill fields
- Component naming: `BookForm` (class) / `app-book-form` (selector) / `book-form.ts` (file) — `IsbnScanOverlay` follows same pattern
- `inject()` is the Angular DI pattern used in this project (no constructor DI in Angular components)
- `signal()` is the state management pattern — no plain properties for reactive state

### File Structure

```
frontend/src/app/
  shared/
    components/
      isbn-scan-overlay/
        isbn-scan-overlay.ts       ← MODIFY (replace placeholder)
        isbn-scan-overlay.spec.ts  ← NEW (unit tests)
```

No other files. No routing changes. No backend changes.

### References

- Story requirements: [_bmad-output/planning-artifacts/epics.md](_bmad-output/planning-artifacts/epics.md) (section "Story 6.2")
- UX spec (IsbnScanOverlayComponent anatomy): [_bmad-output/planning-artifacts/ux-design-specification.md](_bmad-output/planning-artifacts/ux-design-specification.md) (section "IsbnScanOverlayComponent")
- Architecture (BarcodeDetector + ZXing, standalone components): [_bmad-output/planning-artifacts/architecture.md](_bmad-output/planning-artifacts/architecture.md)
- Existing placeholder: [frontend/src/app/shared/components/isbn-scan-overlay/isbn-scan-overlay.ts](frontend/src/app/shared/components/isbn-scan-overlay/isbn-scan-overlay.ts)
- Angular component pattern reference: [frontend/src/app/features/admin/book-form/book-form.ts](frontend/src/app/features/admin/book-form/book-form.ts)
- BookCover pattern (standalone, signals, styles): [frontend/src/app/shared/components/book-cover/book-cover.ts](frontend/src/app/shared/components/book-cover/book-cover.ts)
- Test pattern: [frontend/src/app/shared/components/book-cover/book-cover.spec.ts](frontend/src/app/shared/components/book-cover/book-cover.spec.ts)
- isbn.service.ts (read-only, will be used in 6.3): [frontend/src/app/shared/services/isbn.service.ts](frontend/src/app/shared/services/isbn.service.ts)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None

### Completion Notes List

- Installed `@zxing/browser@^0.1.5` as fallback scanner for Safari iOS (AC #3)
- Replaced placeholder `isbn-scan-overlay.ts` with full standalone Angular 21 component using signals for state management
- BarcodeDetector primary path (Chromium) + ZXing `BrowserMultiFormatReader` fallback path wired via `'BarcodeDetector' in window` check
- Full-screen overlay with terracotta viewfinder corners and animated scan line implemented per UX spec
- `@ViewChild` used for `<video>` element reference (acceptable per architecture notes)
- 5 unit tests passing: overlay renders, aria-live region, manual button emits, success flash emits ISBN after 1s, error state auto-emits after 2s
- Test discovery: Angular `EventEmitter.subscribe()` is unreliable in this Vitest+zoneless env — used `vi.spyOn(emitter, 'emit')` instead; `vi.advanceTimersByTime()` (sync) required over async variant due to test runner behavior

### File List

- `frontend/src/app/shared/components/isbn-scan-overlay/isbn-scan-overlay.ts` (modified — placeholder replaced with full implementation)
- `frontend/src/app/shared/components/isbn-scan-overlay/isbn-scan-overlay.spec.ts` (new — 5 unit tests)
- `frontend/package.json` (modified — `@zxing/browser` dependency added)
- `frontend/package-lock.json` (modified — lock file updated)

## Change Log

- 2026-04-25: Story 6.2 implemented — `IsbnScanOverlay` component fully implemented with BarcodeDetector + ZXing fallback, 5 unit tests, `ng build` and `ng test` passing (57 tests, 0 regressions)

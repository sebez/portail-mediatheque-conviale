import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { vi } from 'vitest';
import { IsbnScanOverlay } from './isbn-scan-overlay';

vi.mock('@zxing/browser', () => ({
  BrowserMultiFormatReader: vi.fn().mockImplementation(() => ({
    decodeFromVideoDevice: vi.fn().mockResolvedValue({ stop: vi.fn() }),
  })),
}));

function makeFakeStream(): MediaStream {
  const track = { stop: vi.fn(), kind: 'video' } as unknown as MediaStreamTrack;
  return { getTracks: () => [track] } as unknown as MediaStream;
}

describe('IsbnScanOverlay', () => {
  let fixture: ComponentFixture<IsbnScanOverlay>;
  let component: IsbnScanOverlay;

  beforeEach(async () => {
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue(makeFakeStream()),
      },
      vibrate: vi.fn(),
    });

    // Force ZXing path (BarcodeDetector unavailable)
    (window as any).BarcodeDetector = undefined;

    // Prevent jsdom HTMLVideoElement.play() from throwing
    HTMLVideoElement.prototype.play = vi.fn().mockResolvedValue(undefined);

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
    const spy = vi.spyOn(component.manualEntryRequested, 'emit');
    // Use Angular's triggerEventHandler for reliable event dispatch in test environments
    const btn = fixture.debugElement.query(By.css('.manual-btn'));
    btn.triggerEventHandler('click', new MouseEvent('click'));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should emit isbnDetected after 1-second success flash (AC #2)', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      fixture.detectChanges();
      const isbns: string[] = [];
      component.isbnDetected.subscribe(v => isbns.push(v));

      (component as any).onScanSuccess('9780374275631');
      fixture.detectChanges();

      expect(component.scanState()).toBe('success');
      expect(component.detectedIsbn()).toBe('9780374275631');

      vi.runAllTimers();

      expect(isbns).toEqual(['9780374275631']);
    } finally {
      vi.useRealTimers();
    }
  });

  it('should show error state and auto-emit manualEntryRequested on getUserMedia failure (AC #4)',
    async () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      try {
        vi.stubGlobal('navigator', {
          mediaDevices: {
            getUserMedia: vi.fn().mockRejectedValue(new Error('NotAllowedError')),
          },
        });

        const spy = vi.spyOn(component.manualEntryRequested, 'emit');

        await component.ngOnInit();
        fixture.detectChanges();

        expect(component.scanState()).toBe('error');
        const errorEl = fixture.nativeElement.querySelector('.error-state');
        expect(errorEl).toBeTruthy();

        vi.advanceTimersByTime(2001);
        expect(spy).toHaveBeenCalledTimes(1);
      } finally {
        vi.useRealTimers();
      }
    }
  );
});

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
      undefined,
      video,
      (result) => {
        if (result) {
          this.onScanSuccess(result.getText());
        }
      }
    );
  }

  private onScanSuccess(isbn: string): void {
    this.stopScanning();
    this.detectedIsbn.set(isbn);
    this.scanState.set('success');
    this.ariaLiveMessage.set(`ISBN détecté : ${isbn}`);

    try { navigator.vibrate(200); } catch { /* not available on all browsers */ }

    this.successTimeoutId = setTimeout(() => {
      this.stopCamera();
      this.isbnDetected.emit(isbn);
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

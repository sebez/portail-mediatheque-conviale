import { Component, Output, EventEmitter } from '@angular/core';

// Placeholder — implemented in Story 6.2 (UX-DR7)
// Full-screen overlay (position: fixed; inset: 0), animated scan line
// BarcodeDetector Web API (primary) + ZXing-js (fallback for Safari iOS)
// getUserMedia requested only on tap, not on page load
@Component({
  selector: 'app-isbn-scan-overlay',
  template: `<div aria-live="polite">Scanner ISBN — à venir</div>`,
})
export class IsbnScanOverlay {
  @Output() isbnDetected = new EventEmitter<string>();
}

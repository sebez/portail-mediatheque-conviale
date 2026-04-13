import { Component, Input } from '@angular/core';

// Placeholder — implemented in Story 2.2 (UX-DR3)
// Sizes: 'small' (64x88px), 'medium' (96x132px), 'large' (120x165px)
// Shows skeleton shimmer while loading, warm grey (#E8E3DD) placeholder for missing/broken covers
@Component({
  selector: 'app-book-cover',
  template: `<div class="book-cover-placeholder"></div>`,
})
export class BookCover {
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() coverUrl: string | null = null;
  @Input() alt = '';
}

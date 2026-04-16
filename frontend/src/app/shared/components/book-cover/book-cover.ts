import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

// UX-DR3: BookCoverComponent — three sizes, skeleton shimmer, warm grey placeholder
// Used by: BookListItemComponent (2.3), SelectionDuMoisCardComponent (2.5), BookDetailComponent (2.4), admin form (5.x)
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

    /* Skeleton shimmer — #E8E3DD maps to --color-outline; #f0ebe6 is its lightened animation midpoint */
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

    /* Placeholder — warm grey (#E8E3DD via --color-outline) with centered book icon */
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
export class BookCover {
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() alt = '';

  // Property setter resets loading state before CD runs — avoids NG0100 from ngOnChanges mutation
  private _coverUrl: string | null = null;
  get coverUrl(): string | null { return this._coverUrl; }
  @Input() set coverUrl(value: string | null) {
    if (value !== this._coverUrl) {
      this._coverUrl = value;
      this.isLoaded = false;
      this.hasError = false;
    }
  }

  isLoaded = false;
  hasError = false;

  onLoad(): void  { this.isLoaded = true; }
  onError(): void { this.hasError = true; }
}

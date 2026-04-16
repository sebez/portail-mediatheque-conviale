import { Component, Input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BookCover } from '../../../shared/components/book-cover/book-cover';
import { BookService } from '../../../shared/services/book.service';
import { Book } from '../../../shared/models/book.model';

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [BookCover, RouterLink, MatProgressSpinnerModule, MatButtonModule, MatIconModule],
  template: `
    <div class="detail-container">
      @if (isLoading) {
        <div class="detail-loading">
          <mat-progress-spinner mode="indeterminate" diameter="40"></mat-progress-spinner>
        </div>
      } @else if (book) {
        <nav class="detail-nav" aria-label="Navigation">
          <a [routerLink]="['/']" mat-button class="detail-back-btn">
            <mat-icon>arrow_back</mat-icon>
            Catalogue
          </a>
        </nav>
        <div class="detail-cover">
          <app-book-cover
            [coverUrl]="book.coverImageUrl"
            size="large"
            [alt]="'Couverture de ' + book.title">
          </app-book-cover>
        </div>
        <div class="detail-meta">
          <h1 class="detail-title">{{ book.title }}</h1>
          <p class="detail-author">{{ book.author }}</p>
          <div class="detail-chips">
            @if (book.genre) {
              <span class="detail-chip">{{ book.genre }}</span>
            }
            @if (book.publicationYear) {
              <span class="detail-chip">{{ book.publicationYear }}</span>
            }
          </div>
        </div>
        @if (book.curatorNote) {
          <div class="detail-note-section">
            <p class="detail-note-label">Note du curateur</p>
            <p class="detail-note">{{ book.curatorNote }}</p>
          </div>
        }
      } @else {
        <nav class="detail-nav" aria-label="Navigation">
          <a [routerLink]="['/']" mat-button class="detail-back-btn">
            <mat-icon>arrow_back</mat-icon>
            Catalogue
          </a>
        </nav>
        <div class="detail-not-found">
          <p class="detail-not-found__message">Livre introuvable.</p>
          <a [routerLink]="['/']" mat-stroked-button>Retour au catalogue</a>
        </div>
      }
    </div>
  `,
  styles: [`
    .detail-container {
      padding: 0 16px 32px;
      margin: 0 auto;
    }
    @media (min-width: 600px) {
      .detail-container {
        padding: 0 24px 32px;
        max-width: 720px;
      }
    }
    @media (min-width: 960px) {
      .detail-container {
        max-width: 800px;
      }
    }

    /* Back navigation row — UX-DR13 */
    .detail-nav {
      padding: 8px 0;
    }
    .detail-back-btn {
      color: var(--color-on-surface-variant) !important;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* Cover — centered on detail page */
    .detail-cover {
      display: flex;
      justify-content: center;
      padding: 24px 0 20px;
    }

    /* Metadata */
    .detail-meta {
      padding-bottom: 20px;
    }
    .detail-title {
      margin: 0 0 4px;
      font-size: 22px;
      font-weight: 700;
      line-height: 1.3;
      color: var(--color-on-surface);
    }
    .detail-author {
      margin: 0 0 12px;
      font-size: 16px;
      color: var(--color-on-surface-variant);
    }
    .detail-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .detail-chip {
      display: inline-block;
      padding: 4px 12px;
      background-color: var(--color-primary-container);
      color: var(--color-on-surface);
      border-radius: 16px;
      font-size: 13px;
    }

    /* Curator note section — UX-DR2: Body large (16px, line-height 1.6) */
    .detail-note-section {
      border-top: 1px solid var(--color-outline);
      padding-top: 20px;
    }
    .detail-note-label {
      margin: 0 0 8px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--color-primary);
    }
    .detail-note {
      margin: 0;
      font-size: 16px;     /* Body large — UX-DR2 */
      line-height: 1.6;    /* Body large — UX-DR2 */
      font-weight: 400;
      color: var(--color-on-surface);
    }

    /* Loading */
    .detail-loading {
      display: flex;
      justify-content: center;
      padding: 64px 0;
    }

    /* Not found */
    .detail-not-found {
      text-align: center;
      padding: 48px 0;
    }
    .detail-not-found__message {
      font-size: 18px;
      color: var(--color-on-surface-variant);
      margin: 0 0 24px;
    }
  `]
})
export class BookDetail implements OnInit {
  @Input() id!: string; // route param ':id' injected via withComponentInputBinding()

  book: Book | null = null;
  isLoading = false;

  constructor(private bookService: BookService) {}

  ngOnInit(): void {
    this.loadBook();
  }

  private loadBook(): void {
    this.isLoading = true;
    this.bookService.getById(+this.id).subscribe({
      next: (book) => {
        this.book = book;
        this.isLoading = false;
      },
      error: () => {
        // HTTP 404 or any error → show "Livre introuvable" state (AC #3)
        this.book = null;
        this.isLoading = false;
      }
    });
  }
}

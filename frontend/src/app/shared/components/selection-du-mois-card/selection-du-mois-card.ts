import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BookCover } from '../book-cover/book-cover';
import { Book } from '../../models/book.model';

@Component({
  selector: 'app-selection-du-mois-card',
  standalone: true,
  imports: [BookCover, RouterLink],
  template: `
    @if (books.length > 0) {
      <section class="sdm-section" role="region" aria-label="Sélection du mois">
        <div class="sdm-header">
          <span class="sdm-badge">Sélection du mois</span>
          <span class="sdm-month">{{ currentMonthLabel }}</span>
        </div>
        <div class="sdm-cards" [class.sdm-cards--multiple]="books.length > 1">
          @for (book of books; track book.id) {
            <article class="sdm-card">
              <div class="sdm-card__cover">
                <app-book-cover
                  [coverUrl]="book.coverImageUrl"
                  size="large"
                  [alt]="'Couverture de ' + book.title">
                </app-book-cover>
              </div>
              <div class="sdm-card__content">
                <h2 class="sdm-card__title">{{ book.title }}</h2>
                <p class="sdm-card__author">{{ book.author }}</p>
                @if (book.curatorNote) {
                  <p class="sdm-card__note">{{ book.curatorNote }}</p>
                }
                <a [routerLink]="['/livres', book.id]" class="sdm-card__link">
                  Voir le livre →
                </a>
              </div>
            </article>
          }
        </div>
      </section>
    }
  `,
  styles: [`
    .sdm-section {
      padding: 0 16px 24px;
      margin: 0 auto;
    }
    @media (min-width: 600px) {
      .sdm-section { padding: 0 24px 24px; max-width: 720px; }
    }
    @media (min-width: 960px) {
      .sdm-section { max-width: 800px; }
    }

    /* Header row */
    .sdm-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    /* Badge pill — terracotta (UX-DR5) */
    .sdm-badge {
      display: inline-block;
      padding: 4px 12px;
      background-color: var(--color-primary);
      color: #ffffff;
      border-radius: 16px;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.02em;
    }

    /* Month label */
    .sdm-month {
      font-size: 14px;
      color: var(--color-on-surface-variant);
    }

    /* Cards container — single book: full width; multiple: horizontal scroll on mobile */
    .sdm-cards {
      display: flex;
      gap: 16px;
    }

    /* Multiple books: horizontal scroll snap on mobile (UX-DR5) */
    .sdm-cards--multiple {
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
      padding-bottom: 8px; /* space for scroll bar */
    }
    .sdm-cards--multiple .sdm-card {
      scroll-snap-align: start;
      flex: 0 0 calc(100% - 32px); /* near-full width on mobile */
    }

    /* 2-col grid on desktop for multiple books (UX-DR5) */
    @media (min-width: 960px) {
      .sdm-cards--multiple {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        overflow-x: unset;
        scroll-snap-type: unset;
      }
      .sdm-cards--multiple .sdm-card {
        flex: unset;
      }
    }

    /* Individual card */
    .sdm-card {
      background: var(--color-surface);
      border: 1px solid var(--color-outline);
      border-radius: 8px;
      padding: 16px;
      display: flex;
      gap: 16px;
      flex: 1; /* single book: fills full width */
    }

    .sdm-card__cover {
      flex-shrink: 0;
    }

    .sdm-card__content {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1;
      min-width: 0; /* prevent overflow */
    }

    /* Title — Title large (UX-DR5, UX typography scale: 20px/600) */
    .sdm-card__title {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      line-height: 1.3;
      color: var(--color-on-surface);
    }

    /* Author — Body medium muted */
    .sdm-card__author {
      margin: 0;
      font-size: 14px;
      color: var(--color-on-surface-variant);
    }

    /* Curator note — Body large italic (UX-DR5: "full curator note in Body large italic") */
    .sdm-card__note {
      margin: 0;
      font-size: 16px;
      font-weight: 400;
      line-height: 1.6;
      font-style: italic;
      color: var(--color-on-surface);
    }

    /* "Voir le livre →" ghost link (UX-DR16: ghost = mat-button text, terracotta) */
    .sdm-card__link {
      display: inline-block;
      margin-top: auto;
      color: var(--color-primary);
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
    }
    .sdm-card__link:hover {
      text-decoration: underline;
    }
  `]
})
export class SelectionDuMoisCard {
  @Input() books: Book[] = [];

  /** French month + year label, e.g., "Avril 2026" */
  get currentMonthLabel(): string {
    const now = new Date();
    const label = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(now);
    return label.charAt(0).toUpperCase() + label.slice(1); // "avril 2026" → "Avril 2026"
  }
}

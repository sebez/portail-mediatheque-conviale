import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BookCover } from '../book-cover/book-cover';
import { Book } from '../../models/book.model';

// UX-DR4: BookListItem — cover (left, 72×100px) + right column (title, author/genre, 2-line note preview)
// Variants: 'default' (with note) | 'compact' (no note — used by admin Story 5.2)
// Accessible: role="article" + aria-label="[title] par [author]"
@Component({
  selector: 'app-book-list-item',
  standalone: true,
  imports: [BookCover, RouterLink],
  template: `
    <a class="book-list-item book-list-item--{{ variant }}"
       [routerLink]="['/livres', book.id]"
       [attr.aria-label]="book.title + ' par ' + book.author"
       role="article">
      <div class="book-list-item__cover-wrapper">
        <app-book-cover
          [coverUrl]="book.coverImageUrl"
          size="medium"
          [alt]="'Couverture de ' + book.title">
        </app-book-cover>
      </div>
      <div class="book-list-item__info">
        <h3 class="book-list-item__title">{{ book.title }}</h3>
        <p class="book-list-item__meta">{{ book.author }}{{ book.genre ? ' · ' + book.genre : '' }}</p>
        @if (variant === 'default' && book.curatorNote) {
          <p class="book-list-item__note">{{ book.curatorNote }}</p>
        }
      </div>
    </a>
  `,
  styles: [`
    .book-list-item {
      display: flex;
      flex-direction: row;
      gap: 12px;
      align-items: flex-start;
      padding: 12px 0;
      border-bottom: 1px solid var(--color-outline);
      text-decoration: none;
      color: inherit;
      cursor: pointer;
    }
    .book-list-item:hover { background-color: var(--color-primary-container); }
    .book-list-item:last-child { border-bottom: none; }

    /* 72×100px display wrapper — constrains BookCover (size="medium" = 96×132px) to UX spec */
    .book-list-item__cover-wrapper {
      width: 72px;
      height: 100px;
      flex-shrink: 0;
      overflow: hidden;
      border-radius: 4px;
    }

    .book-list-item__info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .book-list-item__title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      line-height: 1.4;
      color: var(--color-on-surface);
    }

    .book-list-item__meta {
      margin: 0;
      font-size: 14px;
      color: var(--color-on-surface-variant);
    }

    /* 2-line clamp — UX-DR4 */
    .book-list-item__note {
      margin: 0;
      font-size: 14px;
      font-style: italic;
      color: var(--color-on-surface-variant);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class BookListItem {
  @Input() book!: Book;
  @Input() variant: 'default' | 'compact' = 'default';
}

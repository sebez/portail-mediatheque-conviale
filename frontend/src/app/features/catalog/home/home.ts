import { Component, OnInit } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BookListItem } from '../../../shared/components/book-list-item/book-list-item';
import { BookService } from '../../../shared/services/book.service';
import { Book } from '../../../shared/models/book.model';

// Catalog homepage — full book list view (UX-DR9 responsive)
// Story 2.5 will add SelectionDuMois card and Recently Added section above the list
// Story 3.2 will add FilterBar above the catalog list
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [BookListItem, MatProgressSpinnerModule],
  template: `
    <!-- Story 2.5: SelectionDuMoisCardComponent slot — add above catalog when implemented -->

    <!-- Story 2.5: Recently Added section slot — add above catalog when implemented -->

    <!-- Story 3.2: FilterBarComponent slot — add above catalog list when implemented -->

    <div class="catalog-container">
      @if (isLoading) {
        <div class="catalog-loading">
          <mat-progress-spinner mode="indeterminate" diameter="40"></mat-progress-spinner>
        </div>
      } @else if (books.length === 0) {
        <p class="catalog-empty">La médiathèque est vide pour l'instant.</p>
      } @else {
        <ul class="catalog-list" aria-label="Catalogue de livres">
          @for (book of books; track book.id) {
            <li class="catalog-list__item">
              <app-book-list-item [book]="book" variant="default"></app-book-list-item>
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: [`
    .catalog-container {
      padding: 0 16px;
      margin: 0 auto;
    }
    @media (min-width: 600px) {
      .catalog-container {
        padding: 0 24px;
        max-width: 720px;
      }
    }
    @media (min-width: 960px) {
      .catalog-container {
        max-width: 800px;
      }
    }

    .catalog-loading {
      display: flex;
      justify-content: center;
      padding: 48px 0;
    }

    .catalog-empty {
      padding: 48px 0;
      text-align: center;
      color: var(--color-on-surface-variant);
      font-size: 16px;
    }

    .catalog-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .catalog-list__item {
      display: block;
    }
  `]
})
export class Home implements OnInit {
  books: Book[] = [];
  isLoading = false;

  constructor(private bookService: BookService) {}

  ngOnInit(): void {
    this.loadBooks();
  }

  private loadBooks(): void {
    this.isLoading = true;
    this.bookService.getAll().subscribe({
      next: (books) => {
        this.books = books;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}

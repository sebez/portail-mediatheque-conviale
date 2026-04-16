import { Component, OnInit } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BookListItem } from '../../../shared/components/book-list-item/book-list-item';
import { SelectionDuMoisCard } from '../../../shared/components/selection-du-mois-card/selection-du-mois-card';
import { BookService } from '../../../shared/services/book.service';
import { Book } from '../../../shared/models/book.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [BookListItem, SelectionDuMoisCard, MatProgressSpinnerModule],
  template: `
    <div class="catalog-container">
      @if (isLoading) {
        <div class="catalog-loading">
          <mat-progress-spinner mode="indeterminate" diameter="40"></mat-progress-spinner>
        </div>
      } @else if (books.length === 0) {
        <p class="catalog-empty">La médiathèque est vide pour l'instant.</p>
      } @else {
        <!-- SelectionDuMois section — handles its own absence when empty (UX-DR8) -->
        <app-selection-du-mois-card [books]="selectionBooks"></app-selection-du-mois-card>

        <!-- Recently Added section (UX-DR8, FR13: dateAdded DESC, top 5) -->
        <section class="recently-added" aria-label="Nouveaux arrivages">
          <h2 class="section-heading">Nouveaux arrivages</h2>
          <ul class="catalog-list" aria-label="Livres récents">
            @for (book of recentlyAdded; track book.id) {
              <li class="catalog-list__item">
                <app-book-list-item [book]="book" variant="default"></app-book-list-item>
              </li>
            }
          </ul>
        </section>

        <!-- Full catalog list (Story 2.3 — unchanged) -->
        <!-- Story 3.2: FilterBarComponent slot — add above catalog list when implemented -->
        <section aria-label="Catalogue complet">
          <h2 class="section-heading">Tout le catalogue</h2>
          <ul class="catalog-list" aria-label="Catalogue de livres">
            @for (book of books; track book.id) {
              <li class="catalog-list__item">
                <app-book-list-item [book]="book" variant="default"></app-book-list-item>
              </li>
            }
          </ul>
        </section>

        <!-- Footer freshness signal (UX-DR14, FR13/FR14) -->
        <footer class="catalog-footer">
          {{ books.length }} livres dans la collection · Mis à jour le {{ lastUpdatedLabel }}
        </footer>
      }
    </div>
  `,
  styles: [`
    .catalog-container {
      padding: 0 16px;
      margin: 0 auto;
    }
    @media (min-width: 600px) {
      .catalog-container { padding: 0 24px; max-width: 720px; }
    }
    @media (min-width: 960px) {
      .catalog-container { max-width: 800px; }
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

    /* Section headings */
    .section-heading {
      margin: 24px 0 12px;
      font-size: 18px;
      font-weight: 600;
      color: var(--color-on-surface);
      border-bottom: 1px solid var(--color-outline);
      padding-bottom: 8px;
    }

    .catalog-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .catalog-list__item {
      display: block;
    }

    /* Footer freshness signal (UX-DR14, Label typography: 12px/500) */
    .catalog-footer {
      margin-top: 32px;
      padding: 16px 0;
      border-top: 1px solid var(--color-outline);
      font-size: 12px;
      font-weight: 500;
      color: var(--color-on-surface-variant);
      text-align: center;
    }
  `]
})
export class Home implements OnInit {
  books: Book[] = [];
  selectionBooks: Book[] = [];
  recentlyAdded: Book[] = [];
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
        this.selectionBooks = books.filter(b => b.isSelectionDuMois);
        // Sort by dateAdded DESC (ISO 8601 strings sort lexicographically, same as chronologically)
        this.recentlyAdded = [...books]
          .sort((a, b) => b.dateAdded.localeCompare(a.dateAdded))
          .slice(0, 5);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  /** Most recent dateAdded formatted in French: "15 avril 2026" */
  get lastUpdatedLabel(): string {
    if (this.books.length === 0) return '';
    const latest = this.recentlyAdded[0]?.dateAdded ?? this.books[0]?.dateAdded;
    if (!latest) return '';
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(latest));
  }
}

import { Component, OnInit, ViewChild } from '@angular/core';
import { Subject, switchMap, of } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { BookListItem } from '../../../shared/components/book-list-item/book-list-item';
import { SelectionDuMoisCard } from '../../../shared/components/selection-du-mois-card/selection-du-mois-card';
import { FilterBar } from '../../../shared/components/filter-bar/filter-bar';
import { BookService } from '../../../shared/services/book.service';
import { Book, FilterCriteria } from '../../../shared/models/book.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [BookListItem, SelectionDuMoisCard, MatProgressSpinnerModule, MatButtonModule, FilterBar],
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

        <!-- FilterBar (Story 3.2, UX-DR6) -->
        <app-filter-bar
          [genres]="availableGenres"
          [years]="availableYears"
          (filtersChanged)="onFiltersChanged($event)">
        </app-filter-bar>

        <section aria-label="Catalogue complet">
          <h2 class="section-heading">Tout le catalogue</h2>

          @if (filteredBooks.length === 0 && hasActiveFilters) {
            <!-- AC #5: no-results empty state -->
            <div class="catalog-empty-search">
              <p>Aucun livre ne correspond à votre recherche.</p>
              <button mat-stroked-button (click)="clearFilters()">Effacer les filtres</button>
            </div>
          } @else {
            <ul class="catalog-list" aria-label="Catalogue de livres">
              @for (book of filteredBooks; track book.id) {
                <li class="catalog-list__item">
                  <app-book-list-item [book]="book" variant="default"></app-book-list-item>
                </li>
              }
            </ul>
          }
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

    .catalog-empty-search {
      padding: 32px 0;
      text-align: center;
      color: var(--color-on-surface-variant);
      font-size: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }
  `]
})
export class Home implements OnInit {
  books: Book[] = [];
  allBooks: Book[] = [];
  filteredBooks: Book[] = [];
  selectionBooks: Book[] = [];
  recentlyAdded: Book[] = [];
  availableGenres: string[] = [];
  availableYears: number[] = [];
  hasActiveFilters = false;
  isLoading = false;

  @ViewChild(FilterBar) filterBar?: FilterBar;

  private filterChange$ = new Subject<FilterCriteria>();

  constructor(private bookService: BookService) {}

  ngOnInit(): void {
    this.isLoading = true;

    // Wire filter stream with switchMap to cancel in-flight requests
    this.filterChange$.pipe(
      switchMap(criteria => {
        const hasFilter = !!(criteria.keyword.trim() || criteria.genre || criteria.year != null);
        if (!hasFilter) return of(this.allBooks);
        return this.bookService.getFiltered(criteria);
      })
    ).subscribe(books => {
      this.filteredBooks = books;
    });

    this.bookService.getAll().subscribe({
      next: (books) => {
        this.allBooks = books;
        this.books = books;
        this.filteredBooks = books;
        this.selectionBooks = books.filter(b => b.isSelectionDuMois);
        this.recentlyAdded = [...books]
          .sort((a, b) => b.dateAdded.localeCompare(a.dateAdded))
          .slice(0, 5);
        this.availableGenres = [...new Set(
          books.map(b => b.genre).filter((g): g is string => !!g)
        )].sort();
        this.availableYears = [...new Set(
          books.map(b => b.publicationYear).filter((y): y is number => y != null)
        )].sort((a, b) => b - a);
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  onFiltersChanged(criteria: FilterCriteria): void {
    this.hasActiveFilters = !!(criteria.keyword.trim() || criteria.genre || criteria.year != null);
    this.filterChange$.next(criteria);
  }

  clearFilters(): void {
    this.filterBar?.reset();
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

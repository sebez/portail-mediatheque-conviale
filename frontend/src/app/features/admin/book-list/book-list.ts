import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { BookService } from '../../../shared/services/book.service';
import { BookListItem } from '../../../shared/components/book-list-item/book-list-item';
import { Book } from '../../../shared/models/book.model';
import { ConfirmDeleteDialog } from './confirm-delete-dialog';

@Component({
  selector: 'app-admin-book-list',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    RouterLink,
    BookListItem,
  ],
  template: `
    @if (isLoading()) {
      <div class="loading-container">
        <mat-progress-spinner mode="indeterminate" diameter="40" />
      </div>
    } @else if (books().length === 0) {
      <div class="empty-state">
        <p>La médiathèque est vide pour l'instant.</p>
        <a mat-stroked-button routerLink="/admin/livres/nouveau">Ajouter un livre</a>
      </div>
    } @else {
      <ul class="book-list" role="list">
        @for (book of books(); track book.id) {
          <li class="book-list__row">
            <div class="book-list__item">
              <app-book-list-item [book]="book" variant="compact" />
            </div>
            <div class="book-list__actions">
              <button mat-icon-button
                      [attr.aria-label]="'Modifier ' + book.title"
                      (click)="onEditClick(book)">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button
                      [attr.aria-label]="'Supprimer ' + book.title"
                      (click)="onDeleteClick(book)">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </li>
        }
      </ul>
    }

    @if (deleteError()) {
      <p class="delete-error" role="alert">{{ deleteError() }}</p>
    }

    <button mat-fab extended
            class="add-fab"
            routerLink="/admin/livres/nouveau"
            aria-label="Ajouter un livre">
      <mat-icon>add</mat-icon>
      Ajouter un livre
    </button>
  `,
  styles: [`
    :host {
      display: block;
      padding: 0 16px 96px;
      max-width: 800px;
      margin: 0 auto;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 48px 0;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 48px 0;
      color: var(--color-on-surface-variant);
      text-align: center;
    }

    .book-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .book-list__row {
      display: flex;
      align-items: center;
      border-bottom: 1px solid var(--color-outline);
    }

    .book-list__row:last-child {
      border-bottom: none;
    }

    .book-list__item {
      flex: 1;
      min-width: 0;
    }

    .book-list__actions {
      display: flex;
      flex-shrink: 0;
      gap: 4px;
      padding-left: 8px;
    }

    .delete-error {
      color: var(--color-error);
      padding: 8px 0;
      margin: 0;
      font-size: 14px;
    }

    /* FAB fixed bottom-right — UX-DR10 */
    .add-fab {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 10;
    }
  `],
})
export class BookList implements OnInit {
  private bookService = inject(BookService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  books = signal<Book[]>([]);
  isLoading = signal(true);
  deleteError = signal<string | null>(null);

  ngOnInit(): void {
    this.bookService.getAll().subscribe({
      next: (books) => {
        this.books.set(books);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  onEditClick(book: Book): void {
    this.router.navigate(['/admin/livres', book.id, 'modifier']);
  }

  onDeleteClick(book: Book): void {
    this.deleteError.set(null);
    const dialogRef = this.dialog.open(ConfirmDeleteDialog, {
      data: { id: book.id, title: book.title },
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.bookService.delete(book.id).subscribe({
        next: () => {
          this.books.update(list => list.filter(b => b.id !== book.id));
          this.snackBar.open('Livre supprimé', undefined, { duration: 3000 });
        },
        error: () => {
          this.deleteError.set('Erreur lors de la suppression. Veuillez réessayer.');
        },
      });
    });
  }
}

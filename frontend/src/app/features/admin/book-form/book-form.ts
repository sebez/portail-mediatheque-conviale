import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BookService } from '../../../shared/services/book.service';

@Component({
  selector: 'app-book-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    RouterLink,
  ],
  template: `
    @if (isLoading()) {
      <div class="loading-container">
        <mat-progress-spinner mode="indeterminate" diameter="40" />
      </div>
    } @else {
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="book-form">
        <mat-form-field appearance="outline">
          <mat-label>ISBN</mat-label>
          <input matInput formControlName="isbn" type="text" autocomplete="off" />
          @if (form.get('isbn')?.invalid && form.get('isbn')?.touched) {
            <mat-error>L'ISBN est requis</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Titre</mat-label>
          <input matInput formControlName="title" />
          @if (form.get('title')?.invalid && form.get('title')?.touched) {
            <mat-error>Le titre est requis</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Auteur(s)</mat-label>
          <input matInput formControlName="author" />
          @if (form.get('author')?.invalid && form.get('author')?.touched) {
            <mat-error>L'auteur est requis</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Genre / Catégorie</mat-label>
          <input matInput formControlName="genre" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Année de publication</mat-label>
          <input matInput formControlName="publicationYear" type="number" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Couverture (URL)</mat-label>
          <input matInput formControlName="coverImageUrl" type="url" autocomplete="off" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Note du curateur</mat-label>
          <textarea matInput formControlName="curatorNote" rows="5"></textarea>
        </mat-form-field>

        <div class="toggle-field">
          <mat-slide-toggle formControlName="isSelectionDuMois">
            Sélection du mois
          </mat-slide-toggle>
        </div>

        <div class="form-actions">
          <button mat-stroked-button type="button" routerLink="/admin">
            Annuler
          </button>
          <button mat-raised-button color="primary" type="submit"
                  [disabled]="isSaving() || form.invalid">
            @if (isSaving()) {
              <mat-progress-spinner diameter="20" mode="indeterminate" />
            } @else {
              Enregistrer
            }
          </button>
        </div>
      </form>
    }
  `,
  styles: [`
    :host {
      display: block;
      padding: 24px 16px 48px;
      max-width: 600px;
      margin: 0 auto;
    }

    .book-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    mat-form-field {
      width: 100%;
    }

    .toggle-field {
      padding: 8px 0;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 48px 0;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 8px;
    }
  `],
})
export class BookForm implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private bookService = inject(BookService);
  private snackBar = inject(MatSnackBar);

  private bookId = this.route.snapshot.paramMap.get('id');
  isEditMode = this.bookId !== null;

  isLoading = signal(false);
  isSaving = signal(false);

  form = this.fb.group({
    isbn: ['', Validators.required],
    title: ['', Validators.required],
    author: ['', Validators.required],
    genre: [''],
    publicationYear: [0],
    coverImageUrl: [''],
    curatorNote: [''],
    isSelectionDuMois: [false],
  });

  ngOnInit(): void {
    if (this.isEditMode && this.bookId) {
      this.isLoading.set(true);
      this.bookService.getById(Number(this.bookId)).subscribe({
        next: (book) => {
          this.form.patchValue({
            isbn: book.isbn,
            title: book.title,
            author: book.author,
            genre: book.genre ?? '',
            publicationYear: book.publicationYear,
            coverImageUrl: book.coverImageUrl ?? '',
            curatorNote: book.curatorNote ?? '',
            isSelectionDuMois: book.isSelectionDuMois,
          });
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.router.navigate(['/admin']);
        },
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSaving()) return;

    const value = this.form.getRawValue();
    this.isSaving.set(true);

    if (this.isEditMode && this.bookId) {
      this.bookService.update(Number(this.bookId), {
        isbn: value.isbn ?? '',
        title: value.title ?? '',
        author: value.author ?? '',
        genre: value.genre ?? '',
        publicationYear: value.publicationYear ?? 0,
        coverImageUrl: value.coverImageUrl || null,
        curatorNote: value.curatorNote || null,
        isSelectionDuMois: value.isSelectionDuMois ?? false,
        status: 'available',
      }).subscribe({
        next: () => this.handleSaveSuccess('Livre mis à jour ✓'),
        error: () => this.isSaving.set(false),
      });
    } else {
      this.bookService.create({
        isbn: value.isbn ?? '',
        title: value.title ?? '',
        author: value.author ?? '',
        genre: value.genre ?? '',
        publicationYear: value.publicationYear ?? 0,
        coverImageUrl: value.coverImageUrl || null,
        curatorNote: value.curatorNote || null,
        isSelectionDuMois: value.isSelectionDuMois ?? false,
      }).subscribe({
        next: () => this.handleSaveSuccess('Livre ajouté ✓'),
        error: () => this.isSaving.set(false),
      });
    }
  }

  private handleSaveSuccess(message: string): void {
    this.snackBar.open(message, undefined, { duration: 3000 });
    this.router.navigate(['/admin']);
  }
}

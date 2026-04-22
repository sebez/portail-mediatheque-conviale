import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { FilterCriteria } from '../../models/book.model';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatButtonModule,
  ],
  template: `
    <div class="filter-bar" role="search" aria-label="Rechercher dans le catalogue">

      <!-- Full-width search input — debounce handled in component -->
      <mat-form-field class="filter-bar__search" appearance="outline">
        <input matInput
               type="search"
               placeholder="Rechercher dans le catalogue..."
               [formControl]="searchControl"
               aria-label="Rechercher dans le catalogue">
      </mat-form-field>

      <!-- Genre chips — single-select -->
      @if (genres.length > 0) {
        <div class="filter-bar__chip-group" role="group" aria-label="Filtrer par genre">
          <span class="filter-bar__chip-label">Genre :</span>
          <mat-chip-listbox [multiple]="false"
                            [value]="selectedGenre"
                            (change)="onGenreChange($event.value)">
            @for (genre of genres; track genre) {
              <mat-chip-option [value]="genre"
                               [attr.aria-pressed]="selectedGenre === genre">
                {{ genre }}
              </mat-chip-option>
            }
          </mat-chip-listbox>
        </div>
      }

      <!-- Year chips — single-select -->
      @if (years.length > 0) {
        <div class="filter-bar__chip-group" role="group" aria-label="Filtrer par année">
          <span class="filter-bar__chip-label">Année :</span>
          <mat-chip-listbox [multiple]="false"
                            [value]="selectedYear"
                            (change)="onYearChange($event.value)">
            @for (year of years; track year) {
              <mat-chip-option [value]="year"
                               [attr.aria-pressed]="selectedYear === year">
                {{ year }}
              </mat-chip-option>
            }
          </mat-chip-listbox>
        </div>
      }

      <!-- Clear-all chip — visible only when any filter active (AC #4) -->
      @if (hasActiveFilters) {
        <button class="filter-bar__clear-chip"
                type="button"
                (click)="reset()">
          × Effacer tout
        </button>
      }

    </div>
  `,
  styles: [`
    .filter-bar {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }

    .filter-bar__search {
      width: 100%;
    }

    /* Remove default form-field bottom padding */
    .filter-bar__search ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }

    .filter-bar__chip-group {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .filter-bar__chip-label {
      font-size: 12px;
      font-weight: 500;
      color: var(--color-on-surface-variant);
      white-space: nowrap;
    }

    /* Active chip: terracotta fill */
    ::ng-deep .mat-mdc-chip-option.mat-mdc-chip-selected {
      background-color: var(--color-primary) !important;
      color: #ffffff !important;
    }

    /* Clear-all chip: styled as a chip button */
    .filter-bar__clear-chip {
      display: inline-flex;
      align-items: center;
      padding: 4px 12px;
      border: 1px solid var(--color-outline);
      border-radius: 16px;
      background: transparent;
      font-size: 13px;
      font-weight: 500;
      color: var(--color-on-surface-variant);
      cursor: pointer;
      transition: background 0.15s;
      align-self: flex-start;
    }

    .filter-bar__clear-chip:hover {
      background: var(--color-primary-container);
    }
  `]
})
export class FilterBar implements OnInit, OnDestroy {
  @Input() genres: string[] = [];
  @Input() years: number[] = [];
  @Output() filtersChanged = new EventEmitter<FilterCriteria>();

  searchControl = new FormControl('');
  selectedGenre: string | null = null;
  selectedYear: number | null = null;

  get hasActiveFilters(): boolean {
    return !!(this.searchControl.value?.trim() || this.selectedGenre || this.selectedYear != null);
  }

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => this._emit());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onGenreChange(genre: string | null): void {
    this.selectedGenre = genre ?? null;
    this._emit();
  }

  onYearChange(year: number | null): void {
    this.selectedYear = year ?? null;
    this._emit();
  }

  /** Called by parent Home via @ViewChild to clear all filters */
  reset(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.selectedGenre = null;
    this.selectedYear = null;
    this._emit();
  }

  private _emit(): void {
    this.filtersChanged.emit({
      keyword: this.searchControl.value ?? '',
      genre: this.selectedGenre,
      year: this.selectedYear,
    });
  }
}

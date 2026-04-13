import { Component, Output, EventEmitter } from '@angular/core';

// Placeholder — implemented in Story 3.2 (UX-DR6)
// Full-width search input (debounce 300ms), genre/year chip selectors, "× Effacer tout" chip
// role="search" on input; chips with aria-pressed state; real-time filter updates
@Component({
  selector: 'app-filter-bar',
  template: `<div role="search" aria-label="Rechercher dans le catalogue">Filtres — à venir</div>`,
})
export class FilterBar {
  @Output() filtersChanged = new EventEmitter<unknown>();
}

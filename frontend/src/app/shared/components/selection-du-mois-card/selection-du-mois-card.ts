import { Component, Input } from '@angular/core';

// Placeholder — implemented in Story 2.5 (UX-DR5)
// Full-width feature card with badge pill, month label, large cover, title, author, full curator note
// Multiple books: horizontal scroll snap on mobile, 2-col grid on desktop
// role="region" + aria-label="Sélection du mois"; section absent from DOM when no books featured
@Component({
  selector: 'app-selection-du-mois-card',
  template: `<div role="region" aria-label="Sélection du mois">Sélection du mois — à venir</div>`,
})
export class SelectionDuMoisCard {
  @Input() books: unknown[] = [];
}

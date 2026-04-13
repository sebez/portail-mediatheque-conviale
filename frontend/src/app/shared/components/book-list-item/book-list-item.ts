import { Component, Input } from '@angular/core';

// Placeholder — implemented in Story 2.3 (UX-DR4)
// Shows cover (left, 72x100px) + title/author/genre + 2-line clamped curator note preview
// Variants: 'default' and 'compact'; accessible with role="article" and aria-label
@Component({
  selector: 'app-book-list-item',
  template: `<div role="article">Livre — à venir</div>`,
})
export class BookListItem {
  @Input() book: unknown = null;
}

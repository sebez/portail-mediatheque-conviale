import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { SelectionDuMoisCard } from './selection-du-mois-card';
import { Book } from '../../models/book.model';

const makeBook = (overrides: Partial<Book> = {}): Book => ({
  id: 1,
  isbn: '9780306406157',
  title: 'An Elegant Puzzle',
  author: 'Will Larson',
  genre: 'Management',
  publicationYear: 2019,
  coverImageUrl: null,
  curatorNote: 'Un essai incontournable pour les tech leads.',
  dateAdded: '2026-04-01T00:00:00Z',
  isSelectionDuMois: true,
  status: 'available',
  ...overrides,
});

describe('SelectionDuMoisCard', () => {
  let fixture: ComponentFixture<SelectionDuMoisCard>;
  let component: SelectionDuMoisCard;

  async function create(books: Book[]) {
    await TestBed.configureTestingModule({
      imports: [SelectionDuMoisCard],
      providers: [provideAnimationsAsync(), provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(SelectionDuMoisCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('books', books);
    fixture.detectChanges();
  }

  it('renders nothing when books is empty (AC #2)', async () => {
    await create([]);
    const section = fixture.nativeElement.querySelector('[role="region"]');
    expect(section).toBeNull();
  });

  it('renders role="region" section when books present (AC #1)', async () => {
    await create([makeBook()]);
    const section = fixture.nativeElement.querySelector('[role="region"]');
    expect(section).toBeTruthy();
  });

  it('shows "Sélection du mois" badge (AC #1)', async () => {
    await create([makeBook()]);
    const badge = fixture.nativeElement.querySelector('.sdm-badge');
    expect(badge?.textContent?.trim()).toBe('Sélection du mois');
  });

  it('shows non-empty month label (AC #1)', async () => {
    await create([makeBook()]);
    const monthLabel = fixture.nativeElement.querySelector('.sdm-month');
    expect(monthLabel?.textContent?.trim()).toBeTruthy();
    expect(monthLabel?.textContent?.trim()).toMatch(/\d{4}/); // contains year
  });

  it('shows app-book-cover with size="large" (AC #1)', async () => {
    await create([makeBook()]);
    const coverEl = fixture.debugElement.query(sel => sel.name === 'app-book-cover');
    expect(coverEl).toBeTruthy();
    expect(coverEl?.componentInstance?.size).toBe('large');
  });

  it('shows book title (AC #1)', async () => {
    await create([makeBook()]);
    const title = fixture.nativeElement.querySelector('.sdm-card__title');
    expect(title?.textContent).toContain('An Elegant Puzzle');
  });

  it('shows book author (AC #1)', async () => {
    await create([makeBook()]);
    const author = fixture.nativeElement.querySelector('.sdm-card__author');
    expect(author?.textContent).toContain('Will Larson');
  });

  it('shows full curator note (AC #1)', async () => {
    await create([makeBook()]);
    const note = fixture.nativeElement.querySelector('.sdm-card__note');
    expect(note?.textContent).toContain('Un essai incontournable');
  });

  it('"Voir le livre →" link routes to /livres/:id (AC #1)', async () => {
    await create([makeBook({ id: 42 })]);
    const link = fixture.nativeElement.querySelector('.sdm-card__link');
    expect(link).toBeTruthy();
    // RouterLink with ['/livres', 42] produces href="/livres/42" after router setup
    expect(link?.getAttribute('href')).toContain('/livres/42');
  });

  it('renders multiple articles for multiple books (AC #3)', async () => {
    await create([makeBook({ id: 1 }), makeBook({ id: 2, title: 'Deep Work' })]);
    const cards = fixture.nativeElement.querySelectorAll('.sdm-card');
    expect(cards.length).toBe(2);
  });

  it('adds --multiple modifier class for multiple books (AC #3)', async () => {
    await create([makeBook({ id: 1 }), makeBook({ id: 2 })]);
    const container = fixture.nativeElement.querySelector('.sdm-cards--multiple');
    expect(container).toBeTruthy();
  });
});

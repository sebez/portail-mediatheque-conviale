import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { Home } from './home';
import { BookService } from '../../../shared/services/book.service';
import { Book } from '../../../shared/models/book.model';

const makeBook = (id: number, dateAdded: string, isSelectionDuMois = false): Book => ({
  id,
  isbn: `978000000000${id}`,
  title: `Book ${id}`,
  author: `Author ${id}`,
  genre: 'Fiction',
  publicationYear: 2020 + id,
  coverImageUrl: null,
  curatorNote: `Note for book ${id}`,
  dateAdded,
  isSelectionDuMois,
  status: 'available',
});

describe('Home', () => {
  let fixture: ComponentFixture<Home>;
  let bookServiceMock: { getAll: ReturnType<typeof vi.fn> };

  async function create(books: Book[]) {
    bookServiceMock = { getAll: vi.fn().mockReturnValue(of(books)) };
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        { provide: BookService, useValue: bookServiceMock },
        provideAnimationsAsync(),
        provideRouter([]),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
  }

  it('shows empty state when no books', async () => {
    await create([]);
    const empty = fixture.nativeElement.querySelector('.catalog-empty');
    expect(empty?.textContent).toContain('La médiathèque est vide pour l\'instant.');
  });

  it('SelectionDuMoisCard is absent from DOM when no selection books', async () => {
    const books = [makeBook(1, '2026-04-01T00:00:00Z', false)];
    await create(books);
    const sdmSection = fixture.nativeElement.querySelector('[aria-label="Sélection du mois"]');
    expect(sdmSection).toBeNull();
  });

  it('SelectionDuMoisCard is present when isSelectionDuMois books exist', async () => {
    const books = [makeBook(1, '2026-04-01T00:00:00Z', true)];
    await create(books);
    const sdmSection = fixture.nativeElement.querySelector('[aria-label="Sélection du mois"]');
    expect(sdmSection).toBeTruthy();
  });

  it('Recently Added section shows up to 5 most recent books', async () => {
    const books = [
      makeBook(1, '2026-01-01T00:00:00Z'),
      makeBook(2, '2026-02-01T00:00:00Z'),
      makeBook(3, '2026-03-01T00:00:00Z'),
      makeBook(4, '2026-04-01T00:00:00Z'),
      makeBook(5, '2026-05-01T00:00:00Z'),
      makeBook(6, '2025-12-01T00:00:00Z'),
    ];
    await create(books);
    const recentlyAddedSection = fixture.nativeElement.querySelector('[aria-label="Nouveaux arrivages"]');
    expect(recentlyAddedSection).toBeTruthy();
    const listItems = recentlyAddedSection?.querySelectorAll('li');
    expect(listItems?.length).toBe(5); // shows only top 5
  });

  it('footer shows book count', async () => {
    const books = [makeBook(1, '2026-04-01T00:00:00Z'), makeBook(2, '2026-03-01T00:00:00Z')];
    await create(books);
    const footer = fixture.nativeElement.querySelector('.catalog-footer');
    expect(footer?.textContent).toContain('2 livres dans la collection');
  });

  it('catalog list renders all books', async () => {
    const books = [makeBook(1, '2026-04-01T00:00:00Z'), makeBook(2, '2026-03-01T00:00:00Z')];
    await create(books);
    const catalogSection = fixture.nativeElement.querySelector('[aria-label="Catalogue de livres"]');
    const items = catalogSection?.querySelectorAll('li');
    expect(items?.length).toBe(2);
  });
});

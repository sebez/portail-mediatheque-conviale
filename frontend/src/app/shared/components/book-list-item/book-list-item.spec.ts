import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { BookListItem } from './book-list-item';
import { Book } from '../../models/book.model';

const mockBook: Book = {
  id: 1,
  isbn: '9782070541270',
  title: 'An Elegant Puzzle',
  author: 'Will Larson',
  genre: 'Management',
  publicationYear: 2019,
  coverImageUrl: 'https://covers.openlibrary.org/b/isbn/9782070541270-M.jpg',
  curatorNote: 'Incontournable pour les tech leads. Une réflexion sur le management en ingénierie.',
  dateAdded: '2026-04-01T00:00:00Z',
  isSelectionDuMois: false,
  status: 'available',
};

describe('BookListItem', () => {
  let fixture: ComponentFixture<BookListItem>;
  let component: BookListItem;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookListItem],
      providers: [
        provideAnimationsAsync(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BookListItem);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('book', mockBook);
    fixture.detectChanges();
  });

  it('should render book title (AC #1)', () => {
    const title = fixture.nativeElement.querySelector('.book-list-item__title');
    expect(title?.textContent).toContain('An Elegant Puzzle');
  });

  it('should render author and genre (AC #1)', () => {
    const meta = fixture.nativeElement.querySelector('.book-list-item__meta');
    expect(meta?.textContent).toContain('Will Larson');
    expect(meta?.textContent).toContain('Management');
  });

  it('should include app-book-cover element (AC #2)', () => {
    const bookCover = fixture.nativeElement.querySelector('app-book-cover');
    expect(bookCover).toBeTruthy();
  });

  it('should have role="article" on root element (AC #5)', () => {
    const root = fixture.nativeElement.querySelector('[role="article"]');
    expect(root).toBeTruthy();
  });

  it('should set aria-label with title and author (AC #5)', () => {
    const root = fixture.nativeElement.querySelector('[role="article"]');
    const label = root?.getAttribute('aria-label');
    expect(label).toContain('An Elegant Puzzle');
    expect(label).toContain('Will Larson');
  });

  it('should show curator note preview in default variant (AC #1)', () => {
    // default variant is already set by beforeEach
    const note = fixture.nativeElement.querySelector('.book-list-item__note');
    expect(note).toBeTruthy();
    expect(note?.textContent).toContain('Incontournable');
  });

  it('should NOT show curator note in compact variant (admin use)', () => {
    fixture.componentRef.setInput('variant', 'compact');
    fixture.detectChanges();
    const note = fixture.nativeElement.querySelector('.book-list-item__note');
    expect(note).toBeNull();
  });
});

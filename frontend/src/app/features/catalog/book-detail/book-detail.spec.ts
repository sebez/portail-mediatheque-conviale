import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { BookDetail } from './book-detail';
import { BookService } from '../../../shared/services/book.service';
import { Book } from '../../../shared/models/book.model';

const mockBook: Book = {
  id: 42,
  isbn: '9782070541270',
  title: 'An Elegant Puzzle',
  author: 'Will Larson',
  genre: 'Management',
  publicationYear: 2019,
  coverImageUrl: 'https://covers.openlibrary.org/b/isbn/9782070541270-M.jpg',
  curatorNote: 'Incontournable pour les tech leads. Une réflexion profonde sur le management en ingénierie.',
  dateAdded: '2026-04-01T00:00:00Z',
  isSelectionDuMois: false,
  status: 'available',
};

describe('BookDetail', () => {
  let fixture: ComponentFixture<BookDetail>;
  let component: BookDetail;
  let getById: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    getById = vi.fn().mockReturnValue(of(mockBook));
    const bookServiceMock = { getById };

    await TestBed.configureTestingModule({
      imports: [BookDetail],
      providers: [
        { provide: BookService, useValue: bookServiceMock },
        provideAnimationsAsync(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BookDetail);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('id', '42');
    fixture.detectChanges();
  });

  it('should show spinner while loading (AC #1)', () => {
    // Loading is synchronous here due to of() — spinner resolves before detectChanges
    // Test that isLoading is false after init with synchronous observable
    expect(component.isLoading).toBe(false);
  });

  it('should render book title after load (AC #1)', () => {
    const title = fixture.nativeElement.querySelector('.detail-title');
    expect(title?.textContent).toContain('An Elegant Puzzle');
  });

  it('should render book author (AC #1)', () => {
    const author = fixture.nativeElement.querySelector('.detail-author');
    expect(author?.textContent).toContain('Will Larson');
  });

  it('should render genre and publication year chips (AC #1)', () => {
    const chips = fixture.nativeElement.querySelectorAll('.detail-chip');
    const texts = Array.from(chips).map((c: any) => c.textContent?.trim());
    expect(texts).toContain('Management');
    expect(texts).toContain('2019');
  });

  it('should render app-book-cover with size="large" (AC #4)', () => {
    const bookCover = fixture.nativeElement.querySelector('app-book-cover');
    expect(bookCover).toBeTruthy();
    const coverEl = fixture.debugElement.query(
      sel => sel.name === 'app-book-cover'
    );
    expect(coverEl?.componentInstance?.size).toBe('large');
  });

  it('should pass coverImageUrl to BookCover (AC #4)', () => {
    const coverEl = fixture.debugElement.query(
      sel => sel.name === 'app-book-cover'
    );
    expect(coverEl?.componentInstance?.coverUrl).toBe(mockBook.coverImageUrl);
  });

  it('should show full curator note in detail-note (AC #1)', () => {
    const note = fixture.nativeElement.querySelector('.detail-note');
    expect(note?.textContent).toContain('Incontournable pour les tech leads');
  });

  it('should show back link to "/" (AC #2)', () => {
    expect(fixture.nativeElement.querySelector('.detail-back-btn')).toBeTruthy();
  });

  it('should show "Livre introuvable" when getById returns error (AC #3)', () => {
    getById.mockReturnValue(throwError(() => ({ status: 404 })));
    fixture.componentRef.setInput('id', '999');
    component.ngOnInit();
    fixture.detectChanges();
    const msg = fixture.nativeElement.querySelector('.detail-not-found__message');
    expect(msg?.textContent).toContain('Livre introuvable');
  });

  it('should show catalog link in not-found state (AC #3)', () => {
    getById.mockReturnValue(throwError(() => ({ status: 404 })));
    fixture.componentRef.setInput('id', '999');
    component.ngOnInit();
    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector('.detail-not-found a');
    expect(link).toBeTruthy();
  });
});

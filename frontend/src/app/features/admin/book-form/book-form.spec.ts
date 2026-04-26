import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { BookForm } from './book-form';
import { BookService } from '../../../shared/services/book.service';
import { IsbnService } from '../../../shared/services/isbn.service';

const mockActivatedRoute = {
  snapshot: { paramMap: { get: () => null } },
};

const mockBookService = {
  getById: vi.fn(),
  create: vi.fn().mockReturnValue(of({})),
  update: vi.fn().mockReturnValue(of({})),
};

const mockIsbnService = {
  lookup: vi.fn(),
};

describe('BookForm — ISBN auto-fill (Story 6.3)', () => {
  let fixture: ComponentFixture<BookForm>;
  let component: BookForm;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookForm],
      providers: [
        provideAnimationsAsync(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: BookService, useValue: mockBookService },
        { provide: IsbnService, useValue: mockIsbnService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BookForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => vi.clearAllMocks());

  it('should show scanner overlay when onOpenScanner() is called', () => {
    expect(component.showScanner()).toBe(false);
    component.onOpenScanner();
    expect(component.showScanner()).toBe(true);
    fixture.detectChanges();
    const overlay = fixture.nativeElement.querySelector('app-isbn-scan-overlay');
    expect(overlay).toBeTruthy();
  });

  it('onIsbnDetected should close overlay, set ISBN field, and trigger lookup', () => {
    mockIsbnService.lookup.mockReturnValue(of({ title: 'Test Book', author: 'Test Author' }));
    component.showScanner.set(true);

    component.onIsbnDetected('9780374275631');

    expect(component.showScanner()).toBe(false);
    expect(component.form.get('isbn')?.value).toBe('9780374275631');
    expect(mockIsbnService.lookup).toHaveBeenCalledWith('9780374275631');
  });

  it('onManualEntryRequested should close overlay', () => {
    component.showScanner.set(true);
    component.onManualEntryRequested();
    expect(component.showScanner()).toBe(false);
  });

  it('onLookupIsbn with empty ISBN should not call service', () => {
    component.form.get('isbn')?.setValue('');
    component.onLookupIsbn();
    expect(mockIsbnService.lookup).not.toHaveBeenCalled();
  });

  it('Rechercher button calls onLookupIsbn', () => {
    mockIsbnService.lookup.mockReturnValue(of({ title: 'Book' }));
    component.form.get('isbn')?.setValue('9780374275631');
    const spy = vi.spyOn(component, 'onLookupIsbn');
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button[type="button"]') as NodeListOf<HTMLButtonElement>;
    const rechercher = Array.from(buttons).find(b => b.textContent?.includes('Rechercher'));
    rechercher?.click();

    expect(spy).toHaveBeenCalled();
  });

  it('runIsbnLookup with full data should patch form and set autoFilledFields', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      mockIsbnService.lookup.mockReturnValue(of({
        title: 'Leaves of Grass',
        author: 'Walt Whitman',
        genre: 'Poetry',
        publicationYear: 1990,
        coverImageUrl: 'https://example.com/cover.jpg',
      }));

      component.form.get('isbn')?.setValue('9780374275631');
      component.onLookupIsbn();
      fixture.detectChanges();

      expect(component.form.get('title')?.value).toBe('Leaves of Grass');
      expect(component.form.get('author')?.value).toBe('Walt Whitman');
      expect(component.form.get('genre')?.value).toBe('Poetry');
      expect(component.autoFilledFields().has('title')).toBe(true);
      expect(component.autoFilledFields().has('author')).toBe(true);
      expect(component.showLookupError()).toBe(false);
      expect(component.isIsbnLookingUp()).toBe(false);

      vi.advanceTimersByTime(2000);
      expect(component.autoFilledFields().size).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('runIsbnLookup with empty data should show error banner', () => {
    mockIsbnService.lookup.mockReturnValue(of({}));
    component.form.get('isbn')?.setValue('0000000000');
    component.onLookupIsbn();
    fixture.detectChanges();

    expect(component.showLookupError()).toBe(true);
    const banner = fixture.nativeElement.querySelector('.lookup-error-banner');
    expect(banner?.textContent).toContain('Impossible de récupérer');
  });

  it('runIsbnLookup on HTTP error should show error banner and clear loading', () => {
    mockIsbnService.lookup.mockReturnValue(throwError(() => new Error('Network error')));
    component.form.get('isbn')?.setValue('9780000000000');
    component.onLookupIsbn();
    fixture.detectChanges();

    expect(component.showLookupError()).toBe(true);
    expect(component.isIsbnLookingUp()).toBe(false);
  });
});

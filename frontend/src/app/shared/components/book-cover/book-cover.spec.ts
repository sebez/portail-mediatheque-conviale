import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { BookCover } from './book-cover';

describe('BookCover', () => {
  let fixture: ComponentFixture<BookCover>;
  let component: BookCover;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookCover],
      providers: [provideAnimationsAsync()],
    }).compileComponents();

    fixture = TestBed.createComponent(BookCover);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should show placeholder when coverUrl is null (AC #2)', () => {
    // coverUrl is null by default — no setInput needed
    const placeholder = fixture.nativeElement.querySelector('.book-cover__placeholder');
    const img = fixture.nativeElement.querySelector('img');
    expect(placeholder).toBeTruthy();
    expect(img).toBeNull();
  });

  it('should render <img> when a valid coverUrl is provided (AC #1)', () => {
    // Use setInput() so Angular sequences the input change correctly in CD
    fixture.componentRef.setInput('coverUrl', 'https://covers.openlibrary.org/b/isbn/9782070541270-M.jpg');
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.src).toContain('openlibrary.org');
  });

  it('should show placeholder after image error event fires (AC #2)', () => {
    fixture.componentRef.setInput('coverUrl', 'https://example.com/broken.jpg');
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    img.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    const placeholder = fixture.nativeElement.querySelector('.book-cover__placeholder');
    expect(placeholder).toBeTruthy();
  });

  it('should apply size CSS class from @Input size (AC #3)', () => {
    fixture.componentRef.setInput('size', 'large');
    fixture.detectChanges();

    const container = fixture.nativeElement.querySelector('.book-cover') as HTMLElement;
    expect(container.classList).toContain('book-cover--large');
  });

  it('should pass alt attribute to <img> (AC #4)', () => {
    fixture.componentRef.setInput('coverUrl', 'https://example.com/cover.jpg');
    fixture.componentRef.setInput('alt', 'Couverture de An Elegant Puzzle');
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('alt')).toBe('Couverture de An Elegant Puzzle');
  });
});

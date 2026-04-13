import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Book } from '../models/book.model';

// Placeholder — implemented in Story 6.1 / 6.3
// ALWAYS calls backend /api/isbn/{isbn} — NEVER calls Open Library / Google Books directly from Angular
// IsbnController is [Authorize] — admin-only endpoint
@Injectable({ providedIn: 'root' })
export class IsbnService {
  private readonly apiUrl = `${environment.apiUrl}/isbn`;

  constructor(private http: HttpClient) {}

  lookup(isbn: string): Observable<Partial<Book>> {
    return this.http.get<Partial<Book>>(`${this.apiUrl}/${isbn}`);
  }
}

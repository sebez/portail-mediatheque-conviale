import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Book, FilterCriteria, CreateBookRequest, UpdateBookRequest } from '../models/book.model';

// Placeholder — methods implemented in Stories 2.1, 5.1
// NEVER call Open Library API from Angular — always via .NET IsbnService (architecture rule)
@Injectable({ providedIn: 'root' })
export class BookService {
  private readonly apiUrl = `${environment.apiUrl}/books`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Book[]> {
    return this.http.get<Book[]>(this.apiUrl);
  }

  getById(id: number): Observable<Book> {
    return this.http.get<Book>(`${this.apiUrl}/${id}`);
  }

  getFiltered(criteria: FilterCriteria): Observable<Book[]> {
    let params = new HttpParams();
    if (criteria.keyword.trim()) params = params.set('keyword', criteria.keyword.trim());
    if (criteria.genre) params = params.set('genre', criteria.genre);
    if (criteria.year != null) params = params.set('year', criteria.year.toString());
    return this.http.get<Book[]>(this.apiUrl, { params });
  }

  create(data: CreateBookRequest): Observable<Book> {
    return this.http.post<Book>(this.apiUrl, data);
  }

  update(id: number, data: UpdateBookRequest): Observable<Book> {
    return this.http.put<Book>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

import { Routes } from '@angular/router';

// Admin routes — lazy-loaded chunk, never included in public bundle
// AuthGuard added in Story 4.2
export const adminRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login').then(m => m.Login),
  },
  {
    path: 'livres',
    loadComponent: () => import('./book-list/book-list').then(m => m.BookList),
  },
  {
    path: 'livres/nouveau',
    loadComponent: () => import('./book-form/book-form').then(m => m.BookForm),
  },
  {
    path: 'livres/:id/modifier',
    loadComponent: () => import('./book-form/book-form').then(m => m.BookForm),
  },
  { path: '', redirectTo: 'livres', pathMatch: 'full' },
];

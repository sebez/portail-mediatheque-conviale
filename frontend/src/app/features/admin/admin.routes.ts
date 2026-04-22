import { Routes } from '@angular/router';
import { authGuard } from '../../shared/guards/auth.guard';

// Admin routes — lazy-loaded chunk, never included in public bundle
export const adminRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login').then(m => m.Login),
  },
  {
    path: 'livres',
    canActivate: [authGuard],
    loadComponent: () => import('./book-list/book-list').then(m => m.BookList),
  },
  {
    path: 'livres/nouveau',
    canActivate: [authGuard],
    loadComponent: () => import('./book-form/book-form').then(m => m.BookForm),
  },
  {
    path: 'livres/:id/modifier',
    canActivate: [authGuard],
    loadComponent: () => import('./book-form/book-form').then(m => m.BookForm),
  },
  { path: '', redirectTo: 'livres', pathMatch: 'full' },
];

import { Routes } from '@angular/router';
import { authGuard } from '../../shared/guards/auth.guard';

// Admin routes — lazy-loaded chunk, never included in public bundle
export const adminRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login').then(m => m.Login),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./admin-shell/admin-shell').then(m => m.AdminShell),
    children: [
      {
        path: 'livres',
        data: { title: 'Livres' },
        loadComponent: () => import('./book-list/book-list').then(m => m.BookList),
      },
      {
        path: 'livres/nouveau',
        data: { title: 'Ajouter un livre' },
        loadComponent: () => import('./book-form/book-form').then(m => m.BookForm),
      },
      {
        path: 'livres/:id/modifier',
        data: { title: 'Modifier un livre' },
        loadComponent: () => import('./book-form/book-form').then(m => m.BookForm),
      },
      { path: '', redirectTo: 'livres', pathMatch: 'full' },
    ],
  },
];

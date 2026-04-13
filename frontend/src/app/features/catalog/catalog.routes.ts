import { Routes } from '@angular/router';

export const catalogRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home').then(m => m.Home),
  },
  {
    path: 'livres/:id',
    loadComponent: () => import('./book-detail/book-detail').then(m => m.BookDetail),
  },
];

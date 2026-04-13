import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/catalog/home/home').then(m => m.Home),
  },
  {
    path: 'livres/:id',
    loadComponent: () =>
      import('./features/catalog/book-detail/book-detail').then(m => m.BookDetail),
  },
  {
    // Admin routes — lazy-loaded: admin bundle NEVER included in public bundle (architecture rule)
    path: 'admin',
    loadChildren: () =>
      import('./features/admin/admin.routes').then(m => m.adminRoutes),
  },
  { path: '**', redirectTo: '' },
];

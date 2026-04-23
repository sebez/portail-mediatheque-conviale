import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterOutlet, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../shared/services/auth.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, MatToolbarModule, MatButtonModule, MatIconModule],
  template: `
    <mat-toolbar class="admin-toolbar">
      <span class="spacer"></span>
      <span class="page-title">{{ pageTitle() }}</span>
      <span class="spacer"></span>
      <button mat-icon-button (click)="logout()" aria-label="Se déconnecter">
        <mat-icon>logout</mat-icon>
      </button>
    </mat-toolbar>
    <router-outlet />
  `,
  styles: [`
    .admin-toolbar {
      background: #1A1A1A;
      color: white;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .spacer { flex: 1; }
    .page-title { font-weight: 500; }
  `],
})
export class AdminShell implements OnInit {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private authService = inject(AuthService);

  pageTitle = signal('');

  ngOnInit(): void {
    this.updateTitle();
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.updateTitle());
  }

  private updateTitle(): void {
    let route = this.activatedRoute.snapshot;
    while (route.firstChild) {
      route = route.firstChild;
    }
    this.pageTitle.set(route.data['title'] ?? '');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}

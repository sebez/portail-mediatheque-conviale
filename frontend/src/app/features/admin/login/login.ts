import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
  ],
  template: `
    <div class="login-container">
      <h1 class="login-title">Médiathèque <span class="accent">conviviale</span></h1>
      <mat-card class="login-card">
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Identifiant</mat-label>
              <input matInput formControlName="username" autocomplete="username" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Mot de passe</mat-label>
              <input matInput type="password" formControlName="password" autocomplete="current-password" />
            </mat-form-field>
            @if (errorMessage) {
              <p class="error-message" role="alert">{{ errorMessage }}</p>
            }
            <button
              mat-raised-button
              color="primary"
              type="submit"
              class="full-width submit-button"
              [disabled]="isLoading">
              {{ isLoading ? 'Connexion…' : 'Se connecter' }}
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px 16px;
      background: var(--color-background);
    }
    .login-title {
      font-size: 1.5rem;
      font-weight: 500;
      margin-bottom: 24px;
      color: var(--color-on-surface);
    }
    .accent { color: var(--color-primary); }
    .login-card { width: 100%; max-width: 360px; }
    .full-width { width: 100%; }
    .submit-button { margin-top: 8px; }
    .error-message {
      color: var(--color-error);
      font-size: 0.875rem;
      margin: 4px 0 12px;
    }
  `],
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });
  isLoading = false;
  errorMessage = '';

  onSubmit(): void {
    if (this.form.invalid || this.isLoading) return;
    this.isLoading = true;
    this.errorMessage = '';
    const { username, password } = this.form.value;
    this.authService.login({ username: username!, password: password! }).subscribe({
      next: () => this.router.navigate(['/admin']),
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.status === 401
          ? 'Identifiants incorrects. Veuillez réessayer.'
          : 'Une erreur est survenue. Veuillez réessayer.';
      },
    });
  }
}

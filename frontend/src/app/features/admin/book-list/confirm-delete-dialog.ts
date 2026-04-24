import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { A11yModule } from '@angular/cdk/a11y';

@Component({
  selector: 'app-confirm-delete-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, A11yModule],
  template: `
    <h2 mat-dialog-title>Supprimer ce livre ?</h2>
    <mat-dialog-content>
      <p>Vous êtes sur le point de supprimer "{{ data.title }}".</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button cdkFocusInitial mat-dialog-close>Annuler</button>
      <button mat-button style="color: #B00020" (click)="onConfirm()">Supprimer</button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDeleteDialog {
  readonly data = inject<{ id: number; title: string }>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<ConfirmDeleteDialog>);

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}

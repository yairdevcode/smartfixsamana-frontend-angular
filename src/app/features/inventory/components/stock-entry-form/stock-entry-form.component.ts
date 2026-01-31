import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { PartCatalogService } from '../../../parts/services/parts-catalog.service';
import { InventoryMovementService } from '../../services/inventory-movement.service';
import { PartCatalogResponse } from '../../../../shared/models/part-catalog';
import { InventoryMovementDTO, MovementType } from '../../../../shared/models/inventory-movement';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-stock-entry-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    SpinnerComponent,
  ],
  templateUrl: './stock-entry-form.component.html',
  styleUrl: './stock-entry-form.component.css',
})
export class StockEntryFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private partCatalogService = inject(PartCatalogService);
  private movementService = inject(InventoryMovementService);
  private router = inject(Router);

  form!: FormGroup;
  partsCatalog: PartCatalogResponse[] = [];
  isLoading = false;
  isSubmitting = false;
  selectedPart: PartCatalogResponse | null = null;

  ngOnInit(): void {
    this.initForm();
    this.loadPartsCatalog();
  }

  private initForm(): void {
    this.form = this.fb.group({
      partCatalogId: ['', [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      movementType: ['IN', [Validators.required]],
      reason: ['', [Validators.required]],
      notes: [''],
    });
  }

  private loadPartsCatalog(): void {
    this.isLoading = true;
    console.log('Loading parts catalog...');
    this.partCatalogService.getPartsCatalog()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (parts) => {
          console.log('Parts catalog loaded:', parts);
          this.partsCatalog = parts || [];
        },
        error: (err) => {
          console.error('Error loading parts catalog:', err);
          Swal.fire('Error', 'No se pudo cargar el catálogo de repuestos.', 'error');
        }
      });
  }

  onPartSelected(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const partId = +target.value;
    this.selectedPart = this.partsCatalog.find(p => p.id === partId) || null;
  }

  getNewQuantity(): number {
    if (!this.selectedPart) return 0;
    const quantity = this.form.get('quantity')?.value || 0;
    const movementType = this.form.get('movementType')?.value;

    if (movementType === 'IN') {
      return this.selectedPart.quantity + quantity;
    } else {
      return Math.max(0, this.selectedPart.quantity - quantity);
    }
  }

  isLowStockAfterMovement(): boolean {
    if (!this.selectedPart) return false;
    return this.getNewQuantity() <= this.selectedPart.minStock;
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting) return;

    const formMovementType = this.form.get('movementType')?.value;
    const quantity = this.form.get('quantity')?.value;

    if (formMovementType === 'OUT' && this.selectedPart && quantity > this.selectedPart.quantity) {
      Swal.fire('Error', 'No hay suficiente stock disponible para esta salida.', 'error');
      return;
    }

    // Map IN/OUT to actual movement types
    const movementType: MovementType = formMovementType === 'IN' ? 'PURCHASE' : 'SALE';

    this.isSubmitting = true;
    const movement: InventoryMovementDTO = {
      partCatalogId: +this.form.get('partCatalogId')?.value,
      quantity: quantity,
      movementType: movementType,
      reason: this.form.get('reason')?.value,
      notes: this.form.get('notes')?.value || undefined,
    };

    this.movementService.createMovement(movement)
      .pipe(finalize(() => this.isSubmitting = false))
      .subscribe({
        next: () => {
          Swal.fire(
            'Registrado',
            `Movimiento de ${formMovementType === 'IN' ? 'entrada' : 'salida'} registrado correctamente.`,
            'success'
          );
          this.router.navigate(['/dashboard/inventory']);
        },
        error: (err) => {
          console.error('Error creating movement:', err);
          const message = err?.error?.message || err?.message || 'No se pudo registrar el movimiento.';
          Swal.fire('Error', message, 'error');
        }
      });
  }

  cancel(): void {
    this.router.navigate(['/dashboard/inventory']);
  }
}

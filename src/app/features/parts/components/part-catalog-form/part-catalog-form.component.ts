import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { PartCatalogService } from '../../services/parts-catalog.service';
import { PhoneService } from '../../../phones/services/phone.service';
import { PartCatalogDTO, PartCatalogResponse } from '../../../../shared/models/part-catalog';
import { Phone } from '../../../../shared/models/phone';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-part-catalog-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    SpinnerComponent,
  ],
  templateUrl: './part-catalog-form.component.html',
  styleUrl: './part-catalog-form.component.css',
})
export class PartCatalogFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private partCatalogService = inject(PartCatalogService);
  private phoneService = inject(PhoneService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form!: FormGroup;
  phones: Phone[] = [];
  isEditMode = false;
  isLoading = false;
  isSubmitting = false;
  partCatalogId: number | null = null;

  ngOnInit(): void {
    this.initForm();
    this.loadPhones();
    this.checkEditMode();
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required]],
      quantity: [0, [Validators.required, Validators.min(0)]],
      minStock: [5, [Validators.required, Validators.min(0)]],
      phoneId: [null],
      purchasePrice: [null, [Validators.min(0)]],
      salePrice: [null, [Validators.min(0)]],
    });
  }

  private loadPhones(): void {
    this.phoneService.getPhones().subscribe({
      next: (phones) => {
        this.phones = phones;
      },
      error: (err) => {
        console.error('Error loading phones:', err);
      }
    });
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.partCatalogId = +id;
      this.loadPartCatalog();
    }
  }

  private loadPartCatalog(): void {
    if (!this.partCatalogId) return;

    this.isLoading = true;
    this.partCatalogService.getPartCatalogById(this.partCatalogId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (partCatalog: PartCatalogResponse) => {
          this.form.patchValue({
            name: partCatalog.name,
            description: partCatalog.description,
            quantity: partCatalog.quantity,
            minStock: partCatalog.minStock,
            phoneId: partCatalog.phoneId || null,
            purchasePrice: partCatalog.purchasePrice,
            salePrice: partCatalog.salePrice,
          });
        },
        error: () => {
          Swal.fire('Error', 'No se pudo cargar el repuesto.', 'error');
          this.router.navigate(['/dashboard/parts']);
        }
      });
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting) return;

    this.isSubmitting = true;
    const formValue = this.form.value;

    const partCatalogDTO: PartCatalogDTO = {
      name: formValue.name,
      description: formValue.description,
      quantity: formValue.quantity,
      minStock: formValue.minStock,
      phoneId: formValue.phoneId || undefined,
      purchasePrice: formValue.purchasePrice || undefined,
      salePrice: formValue.salePrice || undefined,
    };

    const operation = this.isEditMode && this.partCatalogId
      ? this.partCatalogService.updatePartCatalog(this.partCatalogId, partCatalogDTO)
      : this.partCatalogService.createPartCatalog(partCatalogDTO);

    operation
      .pipe(finalize(() => this.isSubmitting = false))
      .subscribe({
        next: () => {
          Swal.fire(
            this.isEditMode ? 'Actualizado' : 'Creado',
            this.isEditMode ? 'El repuesto ha sido actualizado.' : 'El repuesto ha sido creado.',
            'success'
          );
          this.router.navigate(['/dashboard/parts']);
        },
        error: (err) => {
          const message = err?.error?.message || err?.message || 'No se pudo guardar el repuesto.';
          Swal.fire('Error', message, 'error');
        }
      });
  }

  cancel(): void {
    this.router.navigate(['/dashboard/parts']);
  }

  get isLowStock(): boolean {
    const quantity = this.form.get('quantity')?.value || 0;
    const minStock = this.form.get('minStock')?.value || 0;
    return quantity <= minStock;
  }

  get profitMargin(): number | null {
    const purchase = this.form.get('purchasePrice')?.value;
    const sale = this.form.get('salePrice')?.value;
    if (purchase && sale && purchase > 0) {
      return ((sale - purchase) / purchase) * 100;
    }
    return null;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(price);
  }
}

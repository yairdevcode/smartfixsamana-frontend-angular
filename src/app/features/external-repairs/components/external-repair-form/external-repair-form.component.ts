import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExternalRepairService } from '../../services/external-repair.service';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-external-repair-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, SpinnerComponent],
  templateUrl: './external-repair-form.component.html',
  styleUrl: './external-repair-form.component.css'
})
export class ExternalRepairFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private externalRepairService = inject(ExternalRepairService);

  form!: FormGroup;
  repairId!: number;
  isEditMode = false;
  isLoading = false;
  isSubmitting = false;

  repairStatuses = [
    { value: 'REPARADO', label: 'Reparado' },
    { value: 'ENTREGADO', label: 'Entregado' },
    { value: 'PENDIENTE_RECOGER', label: 'Pendiente Recoger' }
  ];

  ngOnInit(): void {
    this.form = this.fb.group({
      clientName: ['', Validators.required],
      phoneBrand: ['', Validators.required],
      solution: ['', Validators.required],
      repairPrice: [0, [Validators.required, Validators.min(0)]],
      partCost: [0, [Validators.min(0)]],
      status: ['REPARADO', Validators.required],
      date: ['', Validators.required],
      notes: ['']
    });

    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        this.repairId = +idParam;
        this.isEditMode = true;
        this.loadRepairData();
      }
    });
  }

  private loadRepairData(): void {
    this.isLoading = true;
    this.externalRepairService.getById(this.repairId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (repair) => {
          this.form.patchValue({
            clientName: repair.clientName,
            phoneBrand: repair.phoneBrand,
            solution: repair.solution,
            repairPrice: repair.repairPrice,
            partCost: repair.partCost || 0,
            status: repair.status,
            date: repair.date,
            notes: repair.notes || ''
          });
        },
        error: () => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al cargar los datos de la reparaci\u00f3n'
          });
        }
      });
  }

  get netProfit(): number {
    const repairPrice = this.form.get('repairPrice')?.value || 0;
    const partCost = this.form.get('partCost')?.value || 0;
    return repairPrice - partCost;
  }

  get myShare(): number {
    const partCost = this.form.get('partCost')?.value || 0;
    return (this.netProfit * 0.60) + partCost;
  }

  get storeShare(): number {
    return this.netProfit * 0.40;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(price);
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting) return;

    const dto = this.form.value;
    this.isSubmitting = true;

    if (this.isEditMode && this.repairId != null) {
      this.externalRepairService.update(this.repairId, dto)
        .pipe(finalize(() => this.isSubmitting = false))
        .subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Reparaci\u00f3n actualizada',
              text: 'La reparaci\u00f3n se ha actualizado correctamente.'
            });
            this.router.navigate(['/dashboard/external-repairs']);
          },
          error: () => {
            Swal.fire('Error', 'No se pudo actualizar la reparaci\u00f3n.', 'error');
          }
        });
    } else {
      this.externalRepairService.create(dto)
        .pipe(finalize(() => this.isSubmitting = false))
        .subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Reparaci\u00f3n agregada',
              text: 'La reparaci\u00f3n se ha registrado correctamente.'
            });
            this.router.navigate(['/dashboard/external-repairs']);
          },
          error: () => {
            Swal.fire('Error', 'No se pudo guardar la reparaci\u00f3n.', 'error');
          }
        });
    }
  }

  cancel(): void {
    this.router.navigate(['/dashboard/external-repairs']);
  }

  get todayDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}

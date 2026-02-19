import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { PartTypeService } from '../../services/part-type.service';
import { PartTypeDTO, PartTypeResponse } from '../../../../shared/models/part-type';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-part-type-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    SpinnerComponent,
  ],
  templateUrl: './part-type-form.component.html',
  styleUrl: './part-type-form.component.css',
})
export class PartTypeFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private partTypeService = inject(PartTypeService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form!: FormGroup;
  isEditMode = false;
  isLoading = false;
  isSubmitting = false;
  partTypeId: number | null = null;

  ngOnInit(): void {
    this.initForm();
    this.checkEditMode();
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(255)]],
    });
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.partTypeId = +id;
      this.loadPartType();
    }
  }

  private loadPartType(): void {
    if (!this.partTypeId) return;

    this.isLoading = true;
    this.partTypeService.getPartTypeById(this.partTypeId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (partType: PartTypeResponse) => {
          this.form.patchValue({
            name: partType.name,
            description: partType.description,
          });
        },
        error: () => {
          Swal.fire('Error', 'No se pudo cargar el tipo de repuesto.', 'error');
          this.router.navigate(['/dashboard/part-types']);
        }
      });
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting) return;

    this.isSubmitting = true;
    const formValue = this.form.value;

    const partTypeDTO: PartTypeDTO = {
      name: formValue.name.trim(),
      description: formValue.description?.trim() || undefined,
    };

    const operation = this.isEditMode && this.partTypeId
      ? this.partTypeService.updatePartType(this.partTypeId, partTypeDTO)
      : this.partTypeService.createPartType(partTypeDTO);

    operation
      .pipe(finalize(() => this.isSubmitting = false))
      .subscribe({
        next: () => {
          Swal.fire(
            this.isEditMode ? 'Actualizado' : 'Creado',
            this.isEditMode ? 'El tipo de repuesto ha sido actualizado.' : 'El tipo de repuesto ha sido creado.',
            'success'
          );
          this.router.navigate(['/dashboard/part-types']);
        },
        error: (err) => {
          const message = err?.error?.message || err?.message || 'No se pudo guardar el tipo de repuesto.';
          Swal.fire('Error', message, 'error');
        }
      });
  }

  cancel(): void {
    this.router.navigate(['/dashboard/part-types']);
  }
}

import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PhoneService } from '../../services/phone.service';
import { Phone } from '../../../../shared/models/phone';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-phone-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SpinnerComponent],
  templateUrl: './phone-form.component.html',
  styleUrl: './phone-form.component.css'
})
export class PhoneFormComponent implements OnInit {

    private fb = inject(FormBuilder);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private phoneService = inject(PhoneService);
  
    form!: FormGroup;
    phoneId!: number;
    isEditMode = false;
    isLoading = false;
    isSubmitting = false;
  
    ngOnInit(): void {
      this.form = this.fb.group({
        brand: ['', Validators.required],
        model: ['', Validators.required],
      });
  
      // Detectar si se trata de edición
      this.route.paramMap.subscribe(params => {
        const idParam = params.get('id');
        if (idParam) {
          this.phoneId = +idParam;
          this.isEditMode = true;
          this.loadPhoneData();
        }
      });
    }

    private loadPhoneData(): void {
      this.isLoading = true;
      this.phoneService.getPhoneById(this.phoneId)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe(phone => {
          if (phone) {
            this.form.patchValue(phone);
          }
        });
    }
  
    onSubmit(): void {
      if (this.form.invalid || this.isSubmitting) return;
  
      const phone: Phone = this.form.value;
      this.isSubmitting = true;
  
      if (this.isEditMode && this.phoneId != null) {
        this.phoneService.updatePhone(this.phoneId, phone)
          .pipe(finalize(() => this.isSubmitting = false))
          .subscribe(() => {
            Swal.fire({
              icon: 'success',
              title: 'Teléfono actualizado',
              text: 'El teléfono se ha actualizado correctamente.'
            });
            this.router.navigate(['/dashboard/phones']);
          });
      } else {
        this.phoneService.createPhone(phone)
          .pipe(finalize(() => this.isSubmitting = false))
          .subscribe(() => {
            Swal.fire({
              icon: 'success',
              title: 'Teléfono agregado',
              text: 'El teléfono se ha agregado correctamente.'
            });
            this.router.navigate(['/dashboard/phones']);
          });
      }
    }

    cancel(): void {
      this.router.navigate(['/dashboard/phones']);
    } 
}

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {

  registerform: FormGroup;
  

  constructor(private fb: FormBuilder, private router: Router, private authService: AuthService) {
     this.registerform = this.fb.group({
       email: ['', [Validators.required, Validators.email]],
       username: ['', [Validators.required, Validators.minLength(4)]],
       password: ['', [Validators.required]],
       admin: [{ value: false, disabled: !this.authService.isAdmin() }] // Campo admin deshabilitado por defecto
    });
  }

  register(): void {
    if (this.registerform.invalid) return;

    this.authService.register(this.registerform.value).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Registro exitoso',
          text: 'El usuario ha sido registrado con éxito.',
        });
        this.registerform.reset();
        this.router.navigate(['/login']);
      },
      error: (err) => {
        let errorMessage = 'No se pudo registrar. Por favor, intente de nuevo.';
        let errorTitle = 'Error';

        if (err.status === 409) {
          errorMessage = err.error?.message || 'El recurso ya existe.';
          errorTitle = 'Recurso duplicado';
        } else if (err.status === 403) {
          errorMessage = err.error?.message || 'No tiene permisos para realizar esta acción.';
          errorTitle = 'Acceso denegado';
        }

        Swal.fire({
          icon: 'error',
          title: errorTitle,
          text: errorMessage,
        });
        console.error(err);
      }
    });
  }
 
}

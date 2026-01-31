import { Component } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoginRequest } from '../../../shared/models/login-request';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, SpinnerComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage!: string;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  login() {
    if (this.loginForm.invalid || this.isLoading) return;

    const credentials: LoginRequest = this.loginForm.value;
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(credentials)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          this.authService.setLoginData(response.token, response.username, response.admin);
          Swal.fire({
            icon: 'success',
            title: 'Inicio de sesión exitoso',
            text: 'Bienvenido de nuevo, ' + response.username,
          });
          this.router.navigate(['/dashboard']); 
        },
        error: (err) => {
          this.errorMessage = 'Credenciales incorrectas';
          console.error(err);
        }
      });
  }
  
}

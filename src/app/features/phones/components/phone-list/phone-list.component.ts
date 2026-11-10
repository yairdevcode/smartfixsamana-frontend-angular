import { catchError, of } from 'rxjs';
import { Component, inject } from '@angular/core';
import { PhoneService } from '../../services/phone.service';
import { Router, RouterModule } from '@angular/router';
import { Phone } from '../../../../shared/models/phone';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  tap,
  finalize,
} from 'rxjs';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-phone-list',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    ReactiveFormsModule,
    PaginationComponent,
    SpinnerComponent,
  ],
  templateUrl: './phone-list.component.html',
  styleUrl: './phone-list.component.css',
})
export class PhoneListComponent {
  private phoneService = inject(PhoneService);
  private router = inject(Router);
  private authService = inject(AuthService);

  phones: Phone[] = [];
  loadError = false;
  isLoading = false;
  isSearching = false;
  isDeleting = false;

  searchControl = new FormControl('');
  currentPage = 0;
  totalPages = 0;
  totalElements = 0;
  pageSize = 10;

  ngOnInit(): void {
    // Búsqueda reactiva
    this.searchControl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        tap(() => {
          this.currentPage = 0;
          this.isSearching = true;
          this.loadError = false;
        }),
        switchMap((keyword) =>
          this.phoneService.getPhonesPage(this.currentPage, keyword || '').pipe(
            catchError(() => {
              this.loadError = true;
              return of(null);
            }),
            finalize(() => (this.isSearching = false)),
          ),
        ),
      )
      .subscribe((data) => {
        if (!data) return;
        this.phones = data.content;
        this.totalPages = data.totalPages;
        this.totalElements = data.totalElements;
        this.pageSize = data.size || this.pageSize;
      });

    // Cargar teléfonos sin filtro al inicio
    this.loadPhones();
  }

  loadPhones(): void {
    const keyword = this.searchControl.value || '';
    this.isLoading = true;
    this.loadError = false;

    this.phoneService
      .getPhonesPage(this.currentPage, keyword)
      .pipe(
        catchError(() => {
          this.loadError = true;
          return of(null);
        }),
        finalize(() => (this.isLoading = false)),
      )
      .subscribe((data) => {
        if (!data) return;
        this.phones = data.content;
        this.totalPages = data.totalPages;
        this.totalElements = data.totalElements;
        this.pageSize = data.size || this.pageSize;
      });
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadPhones();
  }

  create(): void {
    this.router.navigate(['/dashboard/phones/new']);
  }

  update(id: number): void {
    this.router.navigate(['/dashboard/phones/edit', id]);
  }
  delete(phone: Phone): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Quieres eliminar el teléfono ${phone.brand} ${phone.model}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.isDeleting = true;
        this.phoneService
          .deletePhone(phone.id!)
          .pipe(finalize(() => (this.isDeleting = false)))
          .subscribe(() => {
            this.loadPhones();
            Swal.fire({
              title: 'Eliminado',
              text: 'Teléfono eliminado con éxito.',
              icon: 'success',
            });
          });
      }
    });
  }

  get admin(): boolean {
    return this.authService.isAdmin();
  }
}

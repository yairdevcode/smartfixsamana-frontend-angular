import { Component, inject, OnInit } from '@angular/core';
import { Customer } from '../../../../shared/models/customer';
import { CustomerService } from '../../services/customers.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  tap,
  finalize,
} from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-customers-list',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    ReactiveFormsModule,
    PaginationComponent,
    SpinnerComponent,
  ],
  templateUrl: './customers-list.component.html',
  styleUrl: './customers-list.component.css',
})
export class CustomersListComponent implements OnInit {
  private customerService = inject(CustomerService);
  private router = inject(Router);
  private authService = inject(AuthService);

  customers: Customer[] = [];
  isLoading = false;
  isSearching = false;
  isDeleting = false;

  searchControl = new FormControl('');
  currentPage = 0;
  totalPages = 0;

  ngOnInit(): void {
    // Búsqueda reactiva
    this.searchControl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        tap(() => {
          this.currentPage = 0;
          this.isSearching = true;
        }),
        switchMap((keyword) =>
          this.customerService.getCustomersPage(this.currentPage, keyword || '')
            .pipe(finalize(() => this.isSearching = false))
        )
      )
      .subscribe((data) => {
        this.customers = data.content;
        this.totalPages = data.totalPages;
      });
    // Cargar clientes sin filtro al inicio
    this.loadCustomers();
  }

  loadCustomers(): void {
    const keyword = this.searchControl.value || '';
    this.isLoading = true;
    
    this.customerService
      .getCustomersPage(this.currentPage, keyword)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe((data) => {
        this.customers = data.content;
        this.totalPages = data.totalPages;
      });
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadCustomers();
  }

  create(): void {
    this.router.navigate(['/dashboard/customers/new']);
  }

  update(id: number): void {
    this.router.navigate(['/dashboard/customers/edit', id]);
  }
  delete(customer: Customer): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Quieres eliminar a ${customer.name} ${customer.lastname}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.isDeleting = true;
        this.customerService.deleteCustomer(customer.id!)
          .pipe(finalize(() => this.isDeleting = false))
          .subscribe(() => {
            this.loadCustomers();
            Swal.fire({
              title: 'Eliminado',
              text: 'Cliente eliminado con éxito.',
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

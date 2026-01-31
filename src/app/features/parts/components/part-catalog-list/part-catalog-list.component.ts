import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  tap,
  finalize,
} from 'rxjs';
import { PartCatalogService, PagedPartsCatalog, PartCatalogFilters } from '../../services/parts-catalog.service';
import { PartCatalogResponse } from '../../../../shared/models/part-catalog';
import { Phone } from '../../../../shared/models/phone';
import { PhoneService } from '../../../phones/services/phone.service';
import { AuthService } from '../../../../core/services/auth.service';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { PaginationParams, DEFAULT_PAGINATION } from '../../../../shared/models/paginated-response';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-part-catalog-list',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    ReactiveFormsModule,
    PaginationComponent,
    SpinnerComponent,
  ],
  templateUrl: './part-catalog-list.component.html',
  styleUrl: './part-catalog-list.component.css',
})
export class PartCatalogListComponent implements OnInit {
  private partCatalogService = inject(PartCatalogService);
  private phoneService = inject(PhoneService);
  private router = inject(Router);
  private authService = inject(AuthService);

  partsCatalog: PartCatalogResponse[] = [];
  phones: Phone[] = [];
  isLoading = false;
  isSearching = false;
  isDeleting = false;

  searchControl = new FormControl('');
  phoneFilterControl = new FormControl<number | null>(null);
  currentPage = 0;
  totalPages = 0;
  totalElements = 0;
  pageSize = DEFAULT_PAGINATION.size;
  sortBy = 'id';
  sortDirection: 'asc' | 'desc' = 'desc';

  ngOnInit(): void {
    this.loadPhones();

    this.searchControl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        tap(() => {
          this.currentPage = 0;
          this.isSearching = true;
        }),
        switchMap(() => {
          const pagination: PaginationParams = {
            page: this.currentPage,
            size: this.pageSize,
            sortBy: this.sortBy,
            sortDirection: this.sortDirection
          };
          const filters: PartCatalogFilters = {
            name: this.searchControl.value || undefined,
            phoneId: this.phoneFilterControl.value || undefined
          };
          return this.partCatalogService.getPartsCatalogPaginated(pagination, filters)
            .pipe(finalize(() => this.isSearching = false));
        })
      )
      .subscribe({
        next: (data: PagedPartsCatalog) => {
          this.partsCatalog = data.content || [];
          this.totalPages = data.totalPages;
          this.totalElements = data.totalElements;
          this.currentPage = data.number;
        },
        error: (err) => {
          console.error('Error searching parts catalog:', err);
        }
      });

    this.phoneFilterControl.valueChanges.subscribe(() => {
      this.currentPage = 0;
      this.loadPartsCatalog();
    });

    this.loadPartsCatalog();
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

  loadPartsCatalog(): void {
    this.isLoading = true;

    const pagination: PaginationParams = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection
    };
    const filters: PartCatalogFilters = {
      name: this.searchControl.value || undefined,
      phoneId: this.phoneFilterControl.value || undefined
    };

    this.partCatalogService
      .getPartsCatalogPaginated(pagination, filters)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (data: PagedPartsCatalog) => {
          this.partsCatalog = data.content || [];
          this.totalPages = data.totalPages;
          this.totalElements = data.totalElements;
          this.currentPage = data.number;
        },
        error: (err) => {
          console.error('Error loading parts catalog:', err);
          Swal.fire('Error', 'No se pudo cargar el catálogo de repuestos.', 'error');
        }
      });
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadPartsCatalog();
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize = newSize;
    this.currentPage = 0; // Reset to first page
    this.loadPartsCatalog();
  }

  create(): void {
    this.router.navigate(['/dashboard/parts/new']);
  }

  update(id: number): void {
    this.router.navigate(['/dashboard/parts/edit', id]);
  }

  delete(partCatalog: PartCatalogResponse): void {
    if (!partCatalog.id) return;

    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Quieres eliminar "${partCatalog.name}" del catálogo?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.isDeleting = true;
        this.partCatalogService.deletePartCatalog(partCatalog.id)
          .pipe(finalize(() => this.isDeleting = false))
          .subscribe({
            next: () => {
              this.loadPartsCatalog();
              Swal.fire('Eliminado', 'El repuesto ha sido eliminado del catálogo.', 'success');
            },
            error: () => {
              Swal.fire('Error', 'No se pudo eliminar el repuesto. Puede estar en uso.', 'error');
            }
          });
      }
    });
  }

  clearPhoneFilter(): void {
    this.phoneFilterControl.setValue(null);
  }

  isLowStock(partCatalog: PartCatalogResponse): boolean {
    return partCatalog.isLowStock;
  }

  getStockStatus(partCatalog: PartCatalogResponse): 'healthy' | 'warning' | 'critical' {
    if (partCatalog.quantity === 0) return 'critical';
    if (partCatalog.isLowStock) return 'warning';
    return 'healthy';
  }

  formatPrice(price?: number): string {
    if (price === undefined || price === null) return '-';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(price);
  }

  get admin(): boolean {
    return this.authService.isAdmin();
  }
}

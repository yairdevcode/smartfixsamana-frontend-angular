import { Component, inject, OnInit } from '@angular/core';
import { RepairService } from '../../services/repair.service';
import { Router, RouterModule } from '@angular/router';
import { Repair } from '../../../../shared/models/repair';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { 
  debounceTime, 
  distinctUntilChanged, 
  switchMap, 
  tap, 
  finalize 
} from 'rxjs';
import { CommonModule } from '@angular/common';
import { Customer } from '../../../../shared/models/customer';
import { Phone } from '../../../../shared/models/phone';
import { AuthService } from '../../../../core/services/auth.service';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-repair',
  standalone: true,
  imports: [
    RouterModule, 
    CommonModule, 
    ReactiveFormsModule, 
    PaginationComponent,
    SpinnerComponent
  ],
  templateUrl: './repair-list.component.html',
  styleUrl: './repair-list.component.css',
})
export class RepairListComponent implements OnInit {
  private repairService = inject(RepairService);
  private router = inject(Router);
  private authService = inject(AuthService);

  repairs: Repair[] = [];
  customers!: Customer[];
  phones!: Phone[];
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
          this.repairService.getRepairsPage(this.currentPage, keyword || '')
            .pipe(finalize(() => this.isSearching = false))
        )
      )
      .subscribe((data: any) => {
        this.repairs = data.content;
        this.totalPages = data.totalPages;
      });

    // Cargar reparaciones sin filtro al inicio
    this.loadRepairs();
  }

  loadRepairs(): void {
    const keyword = this.searchControl.value || '';
    this.isLoading = true;
    
    this.repairService
      .getRepairsPage(this.currentPage, keyword)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe((data: any) => {
        this.repairs = data.content;
        this.totalPages = data.totalPages;
      });
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadRepairs();
  }

  create(): void {
    this.router.navigate(['/dashboard/repairs/new']);
  }

  update(id: number): void {
    this.router.navigate(['/dashboard/repairs/edit', id]);
  }
  
  delete(repair: Repair): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Quieres eliminar la reparación ${repair.phone.brand} ${repair.phone.model}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.isDeleting = true;
        this.repairService.deleteRepair(repair.id!)
          .pipe(finalize(() => this.isDeleting = false))
          .subscribe(() => {
            this.loadRepairs();
            Swal.fire('Eliminado', 'La reparación ha sido eliminada.', 'success');
          });
      }
    });
  }
  
  get admin(): boolean {
    return this.authService.isAdmin();
  }
}

import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ExternalRepairService } from '../../services/external-repair.service';
import { ExternalRepair, ImportReconciliationResponse } from '../../../../shared/models/external-repair';
import { AuthService } from '../../../../core/services/auth.service';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-external-repair-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    PaginationComponent,
    SpinnerComponent
  ],
  templateUrl: './external-repair-list.component.html',
  styleUrl: './external-repair-list.component.css'
})
export class ExternalRepairListComponent implements OnInit {
  private externalRepairService = inject(ExternalRepairService);
  private router = inject(Router);
  private authService = inject(AuthService);

  repairs: ExternalRepair[] = [];
  isLoading = false;
  isDeleting = false;

  // Filters
  statusFilter: string = '';
  startDate: string = '';
  endDate: string = '';

  // Pagination
  currentPage = 0;
  totalPages = 0;

  // Import reconciliation
  importPreview: ImportReconciliationResponse | null = null;
  showImportPreview = false;
  isImporting = false;
  importFile: File | null = null;

  ngOnInit(): void {
    this.loadRepairs();
  }

  loadRepairs(): void {
    this.isLoading = true;
    this.externalRepairService
      .getPage(this.currentPage, 20, this.statusFilter || undefined, this.startDate || undefined, this.endDate || undefined)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe((data: any) => {
        this.repairs = data.content;
        this.totalPages = data.totalPages;
      });
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.loadRepairs();
  }

  clearFilters(): void {
    this.statusFilter = '';
    this.startDate = '';
    this.endDate = '';
    this.currentPage = 0;
    this.loadRepairs();
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadRepairs();
  }

  create(): void {
    this.router.navigate(['/dashboard/external-repairs/new']);
  }

  update(id: number): void {
    this.router.navigate(['/dashboard/external-repairs/edit', id]);
  }

  delete(repair: ExternalRepair): void {
    Swal.fire({
      title: '\u00bfEst\u00e1s seguro?',
      text: `\u00bfQuieres eliminar la reparaci\u00f3n de ${repair.clientName} - ${repair.phoneBrand}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'S\u00ed, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.isDeleting = true;
        this.externalRepairService.delete(repair.id!)
          .pipe(finalize(() => this.isDeleting = false))
          .subscribe(() => {
            this.loadRepairs();
            Swal.fire('Eliminado', 'La reparaci\u00f3n ha sido eliminada.', 'success');
          });
      }
    });
  }

  exportExcel(): void {
    this.externalRepairService.exportExcel(
      this.startDate || undefined,
      this.endDate || undefined,
      this.statusFilter || undefined
    ).subscribe((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'reparaciones_externas.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    if (!this.startDate || !this.endDate) {
      Swal.fire('Filtros requeridos', 'Debes seleccionar un rango de fechas (Desde/Hasta) antes de importar, para saber contra qu\u00e9 reparaciones comparar.', 'warning');
      input.value = '';
      return;
    }

    const file = input.files[0];
    this.importFile = file;

    this.isImporting = true;
    this.externalRepairService.importExcel(file, this.startDate, this.endDate)
      .pipe(finalize(() => this.isImporting = false))
      .subscribe({
        next: (preview) => {
          this.importPreview = preview;
          this.showImportPreview = true;
        },
        error: () => {
          Swal.fire('Error', 'No se pudo leer el archivo Excel.', 'error');
        }
      });
    input.value = '';
  }

  confirmImport(): void {
    if (!this.importFile || !this.startDate || !this.endDate) return;

    this.isImporting = true;
    this.externalRepairService.confirmImport(this.importFile, this.startDate, this.endDate)
      .pipe(finalize(() => this.isImporting = false))
      .subscribe({
        next: (result) => {
          Swal.fire('Importaci\u00f3n aplicada',
            `${result.totalEntregadas} entregadas, ${result.totalPendientesRecoger} pendientes de recoger.`, 'success');
          this.showImportPreview = false;
          this.importPreview = null;
          this.importFile = null;
          this.loadRepairs();
        },
        error: () => {
          Swal.fire('Error', 'No se pudo aplicar la importaci\u00f3n.', 'error');
        }
      });
  }

  cancelImport(): void {
    this.showImportPreview = false;
    this.importPreview = null;
    this.importFile = null;
  }

  // Totals
  get totalRepairPrice(): number {
    return this.repairs.reduce((sum, r) => sum + r.repairPrice, 0);
  }

  get totalPartCost(): number {
    return this.repairs.reduce((sum, r) => sum + (r.partCost || 0), 0);
  }

  get totalNetProfit(): number {
    return this.repairs.reduce((sum, r) => sum + (r.netProfit || 0), 0);
  }

  get totalMyShare(): number {
    return this.repairs.reduce((sum, r) => sum + (r.myShare || 0), 0);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(price);
  }

alertMessage(){
  Swal.fire("No tienes permiso para acceder a este recurso")
}

  get admin(): boolean {
    return this.authService.isAdmin();
  }
}

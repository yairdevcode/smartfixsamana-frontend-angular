import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { SettlementService } from '../../services/settlement.service';
import { Settlement, ImportReconciliationResponse } from '../../../../shared/models/external-repair';
import { AuthService } from '../../../../core/services/auth.service';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-settlement-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SpinnerComponent],
  templateUrl: './settlement-list.component.html',
  styleUrl: './settlement-list.component.css'
})
export class SettlementListComponent implements OnInit {
  private settlementService = inject(SettlementService);
  private authService = inject(AuthService);

  settlements: Settlement[] = [];
  isLoading = false;
  isCreating = false;

  // Date range for new settlement
  newStartDate = '';
  newEndDate = '';
  showCreateForm = false;

  // Import reconciliation
  importPreview: ImportReconciliationResponse | null = null;
  showImportPreview = false;
  isImporting = false;
  importFile: File | null = null;
  importSettlementId: number | null = null;

  ngOnInit(): void {
    this.loadSettlements();
  }

  loadSettlements(): void {
    this.isLoading = true;
    this.settlementService.getAll()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe((data) => {
        this.settlements = data;
      });
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.newStartDate = '';
      this.newEndDate = '';
    }
  }

  createSettlement(): void {
    if (!this.newStartDate || !this.newEndDate) {
      Swal.fire('Error', 'Debes seleccionar el rango de fechas.', 'error');
      return;
    }

    Swal.fire({
      title: 'Generar Liquidaci\u00f3n',
      text: `\u00bfGenerar liquidaci\u00f3n del ${this.newStartDate} al ${this.newEndDate}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'S\u00ed, generar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isCreating = true;
        this.settlementService.create(this.newStartDate, this.newEndDate)
          .pipe(finalize(() => this.isCreating = false))
          .subscribe({
            next: (settlement) => {
              const msg = settlement.warning
                ? `${settlement.warning}\n\nSe liquidaron ${settlement.repairCount} reparaciones.`
                : `Se liquidaron ${settlement.repairCount} reparaciones.`;
              Swal.fire('Liquidaci\u00f3n creada', msg, settlement.warning ? 'warning' : 'success');
              this.showCreateForm = false;
              this.newStartDate = '';
              this.newEndDate = '';
              this.loadSettlements();
            },
            error: (err) => {
              const message = err?.error?.message || err?.error || 'No se pudo generar la liquidaci\u00f3n.';
              Swal.fire('Error', message, 'error');
            }
          });
      }
    });
  }

  exportSettlement(id: number): void {
    this.settlementService.exportExcel(id).subscribe((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `liquidacion_${id}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  onImportFileSelected(event: Event, settlementId: number): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.importFile = file;
    this.importSettlementId = settlementId;

    this.isImporting = true;
    this.settlementService.importExcel(settlementId, file)
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
    if (!this.importFile || !this.importSettlementId) return;

    this.isImporting = true;
    this.settlementService.confirmImport(this.importSettlementId, this.importFile)
      .pipe(finalize(() => this.isImporting = false))
      .subscribe({
        next: (result) => {
          const nuevas = result.entregadasNuevas || 0;
          const anteriores = result.entregadasPendientesAnteriores || 0;
          const pendientes = result.totalPendientesRecoger;
          let msg = `${result.totalEntregadas} reparaciones entregadas`;
          if (nuevas > 0 || anteriores > 0) {
            msg += ` (${nuevas} nuevas + ${anteriores} pendientes anteriores)`;
          }
          msg += `, ${pendientes} siguen pendientes de recoger.`;
          Swal.fire('Importaci\u00f3n aplicada', msg, 'success');
          this.showImportPreview = false;
          this.importPreview = null;
          this.importFile = null;
          this.importSettlementId = null;
          this.loadSettlements();
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
    this.importSettlementId = null;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(price);
  }

  get admin(): boolean {
    return this.authService.isAdmin();
  }
}

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { PartCatalogService } from '../../../parts/services/parts-catalog.service';
import { PartCatalogResponse } from '../../../../shared/models/part-catalog';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-inventory-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SpinnerComponent,
  ],
  templateUrl: './inventory-dashboard.component.html',
  styleUrl: './inventory-dashboard.component.css',
})
export class InventoryDashboardComponent implements OnInit {
  private partCatalogService = inject(PartCatalogService);
  private router = inject(Router);

  lowStockParts: PartCatalogResponse[] = [];
  isLoading = false;

  ngOnInit(): void {
    this.loadLowStockParts();
  }

  loadLowStockParts(): void {
    this.isLoading = true;
    this.partCatalogService.getLowStockParts()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (parts) => {
          this.lowStockParts = parts;
        },
        error: () => {
          this.lowStockParts = [];
        }
      });
  }

  navigateToStockEntry(): void {
    this.router.navigate(['/dashboard/inventory/stock-entry']);
  }

  navigateToMovements(): void {
    this.router.navigate(['/dashboard/inventory/movements']);
  }

  navigateToCatalog(): void {
    this.router.navigate(['/dashboard/parts']);
  }

  getStockPercentage(part: PartCatalogResponse): number {
    if (part.minStock === 0) return 100;
    return Math.min(100, Math.round((part.quantity / part.minStock) * 100));
  }
}

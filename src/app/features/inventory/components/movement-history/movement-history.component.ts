import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  debounceTime,
  distinctUntilChanged,
  finalize,
} from 'rxjs';
import { InventoryMovementService, InventoryMovementFilters, PagedMovements } from '../../services/inventory-movement.service';
import { PartCatalogService } from '../../../parts/services/parts-catalog.service';
import { InventoryMovement, MovementType, isStockIncrease, isStockDecrease } from '../../../../shared/models/inventory-movement';
import { PartCatalogResponse } from '../../../../shared/models/part-catalog';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { PaginationParams, DEFAULT_PAGINATION } from '../../../../shared/models/paginated-response';

@Component({
  selector: 'app-movement-history',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    PaginationComponent,
    SpinnerComponent,
    DatePipe,
  ],
  templateUrl: './movement-history.component.html',
  styleUrl: './movement-history.component.css',
})
export class MovementHistoryComponent implements OnInit {
  private movementService = inject(InventoryMovementService);
  private partCatalogService = inject(PartCatalogService);

  movements: InventoryMovement[] = [];
  partsCatalog: PartCatalogResponse[] = [];
  isLoading = false;
  isLoadingParts = false;

  partFilterControl = new FormControl('');
  typeFilterControl = new FormControl('');
  dateFromControl = new FormControl('');
  dateToControl = new FormControl('');

  currentPage = 0;
  totalPages = 0;
  totalElements = 0;
  pageSize = 4;
  sortBy = 'createdAt';
  sortDirection: 'asc' | 'desc' = 'desc';

  ngOnInit(): void {
    this.loadPartsCatalog();
    this.setupFilters();
    this.loadMovements();
  }

  private loadPartsCatalog(): void {
    this.isLoadingParts = true;
    this.partCatalogService.getPartsCatalog()
      .pipe(finalize(() => this.isLoadingParts = false))
      .subscribe({
        next: (parts) => {
          this.partsCatalog = parts;
        }
      });
  }

  private setupFilters(): void {
    this.partFilterControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.currentPage = 0;
        this.loadMovements();
      });

    this.typeFilterControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.currentPage = 0;
        this.loadMovements();
      });

    this.dateFromControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.currentPage = 0;
        this.loadMovements();
      });

    this.dateToControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.currentPage = 0;
        this.loadMovements();
      });
  }

  loadMovements(): void {
    this.isLoading = true;

    const filters: InventoryMovementFilters = {};

    if (this.partFilterControl.value) {
      filters.partCatalogId = +this.partFilterControl.value;
    }
    if (this.typeFilterControl.value) {
      filters.movementType = this.typeFilterControl.value as MovementType;
    }
    if (this.dateFromControl.value) {
      filters.dateFrom = this.dateFromControl.value;
    }
    if (this.dateToControl.value) {
      filters.dateTo = this.dateToControl.value;
    }

    const pagination: PaginationParams = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection
    };

    this.movementService.getMovementsPaginated(pagination, filters)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (data: PagedMovements) => {
          this.movements = data.content;
          this.totalPages = data.totalPages;
          this.totalElements = data.totalElements;
          this.currentPage = data.number;
        },
        error: () => {
          this.movements = [];
          this.totalPages = 0;
          this.totalElements = 0;
        }
      });
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadMovements();
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize = newSize;
    this.currentPage = 0; // Reset to first page
    this.loadMovements();
  }

  clearFilters(): void {
    this.partFilterControl.setValue('');
    this.typeFilterControl.setValue('');
    this.dateFromControl.setValue('');
    this.dateToControl.setValue('');
  }

  hasActiveFilters(): boolean {
    return !!(
      this.partFilterControl.value ||
      this.typeFilterControl.value ||
      this.dateFromControl.value ||
      this.dateToControl.value
    );
  }

  isIncoming(type: MovementType): boolean {
    return isStockIncrease(type);
  }

  isOutgoing(type: MovementType): boolean {
    return isStockDecrease(type);
  }
}

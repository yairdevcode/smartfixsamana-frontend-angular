import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  InventoryMovement,
  InventoryMovementDTO,
  MovementType
} from '../../../shared/models/inventory-movement';
import {
  PaginatedResponse,
  PaginationParams,
  DEFAULT_PAGINATION
} from '../../../shared/models/paginated-response';

/**
 * Filters for querying inventory movements
 */
export interface InventoryMovementFilters {
  partCatalogId?: number;
  movementType?: MovementType;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Paginated response from backend
 */
export interface PagedMovements extends PaginatedResponse<InventoryMovement> {}

@Injectable({
  providedIn: 'root'
})
export class InventoryMovementService {

  private readonly baseUrl = `${environment.apiUrl}/api/inventory-movements`;

  constructor(private http: HttpClient) { }

  /**
   * Create a new inventory movement
   * POST /api/inventory-movements
   */
  createMovement(movement: InventoryMovementDTO): Observable<InventoryMovement> {
    return this.http.post<InventoryMovement>(this.baseUrl, movement);
  }

  /**
   * Get all movements (no pagination)
   * GET /api/inventory-movements/all
   */
  getAllMovements(): Observable<InventoryMovement[]> {
    return this.http.get<InventoryMovement[]>(`${this.baseUrl}/all`);
  }

  /**
   * Get movement by ID
   * GET /api/inventory-movements/{id}
   */
  getMovementById(id: number): Observable<InventoryMovement> {
    return this.http.get<InventoryMovement>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get movements by part catalog ID
   * GET /api/inventory-movements/part-catalog/{id}
   */
  getMovementsByPartCatalog(partCatalogId: number): Observable<InventoryMovement[]> {
    return this.http.get<InventoryMovement[]>(`${this.baseUrl}/part-catalog/${partCatalogId}`);
  }

  /**
   * Get movements with pagination and optional filters
   * Uses backend pagination with full filter support
   */
  getMovementsPaginated(
    pagination: PaginationParams = DEFAULT_PAGINATION,
    filters: InventoryMovementFilters = {}
  ): Observable<PagedMovements> {
    let params = new HttpParams()
      .set('page', pagination.page.toString())
      .set('size', pagination.size.toString())
      .set('sortBy', pagination.sortBy)
      .set('sortDirection', pagination.sortDirection);

    if (filters.partCatalogId) {
      params = params.set('partCatalogId', filters.partCatalogId.toString());
    }
    if (filters.movementType) {
      params = params.set('movementType', filters.movementType);
    }
    if (filters.dateFrom) {
      params = params.set('dateFrom', filters.dateFrom);
    }
    if (filters.dateTo) {
      params = params.set('dateTo', filters.dateTo);
    }

    return this.http.get<PagedMovements>(this.baseUrl, { params });
  }

  /**
   * @deprecated Use getMovementsPaginated instead
   * Legacy method for backwards compatibility
   */
  getMovements(page: number, filters: InventoryMovementFilters = {}): Observable<InventoryMovement[]> {
    return this.http.get<InventoryMovement[]>(`${this.baseUrl}/all`);
  }

  /**
   * Create a stock entry movement (purchase)
   */
  createStockEntry(partCatalogId: number, quantity: number, reason?: string, notes?: string): Observable<InventoryMovement> {
    const movement: InventoryMovementDTO = {
      partCatalogId,
      movementType: 'PURCHASE',
      quantity,
      reason: reason || 'Entrada de stock',
      notes
    };
    return this.createMovement(movement);
  }

  /**
   * Create a stock exit movement (sale)
   */
  createStockExit(partCatalogId: number, quantity: number, reason?: string, notes?: string): Observable<InventoryMovement> {
    const movement: InventoryMovementDTO = {
      partCatalogId,
      movementType: 'SALE',
      quantity,
      reason: reason || 'Salida de stock',
      notes
    };
    return this.createMovement(movement);
  }

  /**
   * Create a damage/loss movement
   */
  createDamageMovement(partCatalogId: number, quantity: number, reason?: string, notes?: string): Observable<InventoryMovement> {
    const movement: InventoryMovementDTO = {
      partCatalogId,
      movementType: 'DAMAGE',
      quantity,
      reason: reason || 'Daño o pérdida',
      notes
    };
    return this.createMovement(movement);
  }

  /**
   * Create an adjustment movement
   */
  createAdjustment(partCatalogId: number, quantity: number, reason?: string, notes?: string): Observable<InventoryMovement> {
    const movement: InventoryMovementDTO = {
      partCatalogId,
      movementType: 'ADJUSTMENT',
      quantity,
      reason: reason || 'Ajuste de inventario',
      notes
    };
    return this.createMovement(movement);
  }
}

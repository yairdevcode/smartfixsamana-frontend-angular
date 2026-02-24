import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PartCatalogDTO, PartCatalogResponse } from '../../../shared/models/part-catalog';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  PaginatedResponse,
  PaginationParams,
  DEFAULT_PAGINATION
} from '../../../shared/models/paginated-response';

/**
 * Filters for querying parts catalog
 */
export interface PartCatalogFilters {
  name?: string;
  phoneId?: number;
}

/**
 * Paginated response for parts catalog
 */
export interface PagedPartsCatalog extends PaginatedResponse<PartCatalogResponse> {}

@Injectable({
  providedIn: 'root'
})
export class PartCatalogService {

  private partCatalogUrl = `${environment.apiUrl}/api/parts-catalog`;

  constructor(private http: HttpClient) { }

  /**
   * Get all parts without pagination (legacy)
   */
  getPartsCatalog(): Observable<PartCatalogResponse[]> {
    return this.http.get<PartCatalogResponse[]>(`${this.partCatalogUrl}/all`);
  }

  /**
   * Get parts catalog with pagination and optional filters
   * Uses backend pagination with full filter support
   */
  getPartsCatalogPaginated(
    pagination: PaginationParams = DEFAULT_PAGINATION,
    filters: PartCatalogFilters = {}
  ): Observable<PagedPartsCatalog> {
    let params = new HttpParams()
      .set('page', pagination.page.toString())
      .set('size', pagination.size.toString())
      .set('sortBy', pagination.sortBy)
      .set('sortDirection', pagination.sortDirection);

    if (filters.name) {
      params = params.set('name', filters.name);
    }
    if (filters.phoneId) {
      params = params.set('phoneId', filters.phoneId.toString());
    }

    return this.http.get<PagedPartsCatalog>(this.partCatalogUrl, { params });
  }

  getPartCatalogById(id: number): Observable<PartCatalogResponse> {
    return this.http.get<PartCatalogResponse>(`${this.partCatalogUrl}/${id}`);
  }

  /**
   * Search parts by name and/or phoneId
   * Uses the backend /search endpoint
   */
  getPartsCatalogPage(page: number, keyword: string = '', phoneId?: number): Observable<PartCatalogResponse[]> {
    let params = new HttpParams();
    if (keyword) {
      params = params.set('name', keyword);
    }
    if (phoneId) {
      params = params.set('phoneId', phoneId.toString());
    }
    return this.http.get<PartCatalogResponse[]>(`${this.partCatalogUrl}/search`, { params });
  }

  getLowStockParts(): Observable<PartCatalogResponse[]> {
    return this.http.get<PartCatalogResponse[]>(`${this.partCatalogUrl}/low-stock`);
  }

  createPartCatalog(partCatalog: PartCatalogDTO): Observable<PartCatalogResponse> {
    return this.http.post<PartCatalogResponse>(this.partCatalogUrl, partCatalog);
  }

  updatePartCatalog(id: number, partCatalog: PartCatalogDTO): Observable<PartCatalogResponse> {
    return this.http.put<PartCatalogResponse>(`${this.partCatalogUrl}/${id}`, partCatalog);
  }

  deletePartCatalog(id: number): Observable<void> {
    return this.http.delete<void>(`${this.partCatalogUrl}/${id}`);
  }

  /**
   * Search parts with filter support
   * Uses the backend /search endpoint
   */
  searchParts(name?: string, phoneId?: number): Observable<PartCatalogResponse[]> {
    let params = new HttpParams();
    if (name) {
      params = params.set('name', name);
    }
    if (phoneId) {
      params = params.set('phoneId', phoneId.toString());
    }
    return this.http.get<PartCatalogResponse[]>(`${this.partCatalogUrl}/search`, { params });
  }

  /**
   * Get all parts with quantity > 0
   */
  getAvailableParts(): Observable<PartCatalogResponse[]> {
    return this.http.get<PartCatalogResponse[]>(`${this.partCatalogUrl}/available`);
  }

  /**
   * Get parts compatible with a specific phone
   */
  getPartsByPhone(phoneId: number): Observable<PartCatalogResponse[]> {
    return this.http.get<PartCatalogResponse[]>(`${this.partCatalogUrl}/by-phone/${phoneId}`);
  }

  /**
   * Search available parts (quantity > 0) by keyword, optionally filtered by phone.
   * Uses the dedicated /search/available endpoint that returns a plain array.
   * Defensively handles both a plain array and a Spring Page wrapper ({ content: [...] }).
   */
  searchAvailableParts(keyword: string, phoneId?: number): Observable<PartCatalogResponse[]> {
    let params = new HttpParams();
    if (keyword) {
      params = params.set('name', keyword);
    }
    if (phoneId) {
      params = params.set('phoneId', phoneId.toString());
    }
    return this.http.get<PartCatalogResponse[] | PagedPartsCatalog>(`${this.partCatalogUrl}/search/available`, { params }).pipe(
      map(res => Array.isArray(res) ? res : res.content)
    );
  }
}

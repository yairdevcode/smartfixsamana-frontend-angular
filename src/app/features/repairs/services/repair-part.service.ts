import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RepairPart, RepairPartRequest } from '../../../shared/models/repair-part';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RepairPartService {

  private baseUrl = `${environment.apiUrl}/api/repairs`;

  constructor(private http: HttpClient) { }

  /**
   * Get all parts used in a specific repair
   * GET /api/repairs/{repairId}/parts
   */
  getPartsByRepair(repairId: number): Observable<RepairPart[]> {
    return this.http.get<RepairPart[]>(`${this.baseUrl}/${repairId}/parts`);
  }

  /**
   * Add a part to a repair
   * POST /api/repairs/{repairId}/parts
   */
  addPartToRepair(repairId: number, request: RepairPartRequest): Observable<RepairPart> {
    return this.http.post<RepairPart>(`${this.baseUrl}/${repairId}/parts`, request);
  }

  /**
   * Remove a part from a repair
   * DELETE /api/repairs/{repairId}/parts/{repairPartId}
   */
  removePartFromRepair(repairId: number, repairPartId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${repairId}/parts/${repairPartId}`);
  }
}

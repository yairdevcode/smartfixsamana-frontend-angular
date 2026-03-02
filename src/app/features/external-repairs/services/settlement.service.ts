import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Settlement, ImportReconciliationResponse } from '../../../shared/models/external-repair';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SettlementService {

  private baseUrl = `${environment.apiUrl}/api/settlements`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Settlement[]> {
    return this.http.get<Settlement[]>(this.baseUrl);
  }

  getById(id: number): Observable<Settlement> {
    return this.http.get<Settlement>(`${this.baseUrl}/${id}`);
  }

  create(startDate: string, endDate: string): Observable<Settlement> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.post<Settlement>(this.baseUrl, null, { params });
  }

  exportExcel(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/export`, {
      responseType: 'blob'
    });
  }

  importExcel(id: number, file: File): Observable<ImportReconciliationResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ImportReconciliationResponse>(`${this.baseUrl}/${id}/import`, formData);
  }

  confirmImport(id: number, file: File): Observable<ImportReconciliationResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ImportReconciliationResponse>(`${this.baseUrl}/${id}/import/confirm`, formData);
  }
}

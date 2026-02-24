import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ExternalRepair, ExternalRepairDTO, ImportReconciliationResponse } from '../../../shared/models/external-repair';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExternalRepairService {

  private baseUrl = `${environment.apiUrl}/api/external-repairs`;

  constructor(private http: HttpClient) {}

  getPage(page: number, size: number = 20, status?: string, startDate?: string, endDate?: string): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (status) params = params.set('status', status);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<any>(this.baseUrl, { params });
  }

  getById(id: number): Observable<ExternalRepair> {
    return this.http.get<ExternalRepair>(`${this.baseUrl}/${id}`);
  }

  create(dto: ExternalRepairDTO): Observable<ExternalRepair> {
    return this.http.post<ExternalRepair>(this.baseUrl, dto);
  }

  update(id: number, dto: ExternalRepairDTO): Observable<ExternalRepair> {
    return this.http.put<ExternalRepair>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  exportExcel(startDate?: string, endDate?: string, status?: string): Observable<Blob> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    if (status) params = params.set('status', status);

    return this.http.get(`${this.baseUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }

  importExcel(file: File, startDate: string, endDate: string): Observable<ImportReconciliationResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.post<ImportReconciliationResponse>(`${this.baseUrl}/import`, formData, { params });
  }

  confirmImport(file: File, startDate: string, endDate: string): Observable<ImportReconciliationResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.post<ImportReconciliationResponse>(`${this.baseUrl}/import/confirm`, formData, { params });
  }
}

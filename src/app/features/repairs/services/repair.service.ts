import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Repair, RepairDTO } from '../../../shared/models/repair';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RepairService {

  private repairUrl = `${environment.apiUrl}/repairs`;

  constructor(private http: HttpClient) {}

  getCountRepairs(): Observable<number> {
    return this.http.get<number>(`${this.repairUrl}/count`);
  }

  getRepairs(): Observable<Repair[]> {
    return this.http.get<Repair[]>(this.repairUrl);
  }

  getRepairById(id: number): Observable<Repair> {
    return this.http.get<Repair>(`${this.repairUrl}/${id}`);
  }

  createRepair(repair: RepairDTO): Observable<Repair> {
    return this.http.post<Repair>(`${this.repairUrl}`, repair);
  }

  updateRepair(id: number, repair: RepairDTO): Observable<Repair> {
    return this.http.put<Repair>(`${this.repairUrl}/${id}`, repair);
  }

  deleteRepair(id: number): Observable<any> {
    return this.http.delete(`${this.repairUrl}/${id}`, {
      responseType: 'text',
    });
  }

  getRepairsPage(page: number, keyword: string = ''): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('keyword', keyword.trim());

    return this.http.get<any>(`${this.repairUrl}/search`, { params });
  }

  /**
   * Update just the labor cost for a repair
   */
  updateLaborCost(repairId: number, laborCost: number): Observable<Repair> {
    return this.http.patch<Repair>(`${this.repairUrl}/${repairId}/labor-cost`, { laborCost });
  }
}

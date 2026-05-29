import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DailyEarnings, EarningsSummary, RangeEarnings } from '../../../shared/models/earnings';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EarningsService {

  private baseUrl = `${environment.apiUrl}/api/earnings`;

  constructor(private http: HttpClient) {}

  getSummary(): Observable<EarningsSummary> {
    return this.http.get<EarningsSummary>(`${this.baseUrl}/summary`);
  }

  getDaily(date?: string): Observable<DailyEarnings> {
    let params = new HttpParams();
    if (date) {
      params = params.set('date', date);
    }
    return this.http.get<DailyEarnings>(`${this.baseUrl}/daily`, { params });
  }

  getRange(startDate: string, endDate: string): Observable<RangeEarnings> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.get<RangeEarnings>(`${this.baseUrl}/range`, { params });
  }
}

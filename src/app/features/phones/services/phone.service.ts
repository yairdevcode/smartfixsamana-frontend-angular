import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Phone } from '../../../shared/models/phone';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PhoneService {
  private phoneUrl = `${environment.apiUrl}/phones`;

  constructor(private http: HttpClient) {}

  getCountPhones(): Observable<number> {
    return this.http.get<number>(`${this.phoneUrl}/count`);
  }

  getPhones(): Observable<Phone[]> {
    return this.http.get<Phone[]>(this.phoneUrl);
  }
  getPhoneById(id: number): Observable<Phone> {
    return this.http.get<Phone>(`${this.phoneUrl}/${id}`);
  }
  createPhone(phone: Phone): Observable<Object> {
    return this.http.post(`${this.phoneUrl}`, phone);
  }
  updatePhone(id: number, phone: Phone): Observable<object> {
    return this.http.put(`${this.phoneUrl}/${id}`, phone);
  }
  deletePhone(id: number): Observable<any> {
    return this.http.delete(`${this.phoneUrl}/${id}`, {
      responseType: 'text',
    });
  }
   getPhonesPage(page: number, keyword: string = ''): Observable<any> {
      const params = new HttpParams()
        .set('page', page.toString())
        .set('keyword', keyword.trim());
  
      return this.http.get<any>(`${this.phoneUrl}/search`, { params });
    }
}

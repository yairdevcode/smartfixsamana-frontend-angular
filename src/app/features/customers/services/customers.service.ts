import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Customer } from '../../../shared/models/customer';
import { environment } from '../../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class CustomerService {

  private customertUrl = `${environment.apiUrl}/customers`;


  constructor(private http: HttpClient) {}

  getCountCustomers(): Observable<number> {
    return this.http.get<number>(`${this.customertUrl}/count`);
  }

  getCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.customertUrl);
  }
   
  getCustomerById(id: number): Observable<Customer> {
    return this.http.get<Customer>(`${this.customertUrl}/${id}`);
  }
  createCustomer(customer: Customer): Observable<Object> {
    return this.http.post(`${this.customertUrl}`, customer);
  }
  updateCustomer(id: number, customer: Customer): Observable<object> {
    return this.http.put(`${this.customertUrl}/${id}`, customer);
  }
  deleteCustomer(id: number) {
    return this.http.delete(`${this.customertUrl}/${id}`, {
      responseType: 'text',
    });
  }

  // Método para buscar clientes por palabra clave
   getCustomersPage(page: number, keyword: string = ''): Observable<any> {
      const params = new HttpParams()
        .set('page', page.toString())
        .set('keyword', keyword.trim());
  
      return this.http.get<any>(`${this.customertUrl}/search`, { params });
    }
}

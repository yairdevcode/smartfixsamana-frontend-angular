import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PartTypeDTO, PartTypeResponse } from '../../../shared/models/part-type';

@Injectable({
  providedIn: 'root'
})
export class PartTypeService {

  private partTypeUrl = `${environment.apiUrl}/api/part-types`;

  constructor(private http: HttpClient) { }

  /**
   * Get all part types ordered by name
   */
  getPartTypes(): Observable<PartTypeResponse[]> {
    return this.http.get<PartTypeResponse[]>(this.partTypeUrl);
  }

  /**
   * Get a part type by ID
   */
  getPartTypeById(id: number): Observable<PartTypeResponse> {
    return this.http.get<PartTypeResponse>(`${this.partTypeUrl}/${id}`);
  }

  /**
   * Search part types by name
   */
  searchPartTypes(name: string): Observable<PartTypeResponse[]> {
    const params = new HttpParams().set('name', name);
    return this.http.get<PartTypeResponse[]>(`${this.partTypeUrl}/search`, { params });
  }

  /**
   * Create a new part type
   */
  createPartType(partType: PartTypeDTO): Observable<PartTypeResponse> {
    return this.http.post<PartTypeResponse>(this.partTypeUrl, partType);
  }

  /**
   * Update an existing part type
   */
  updatePartType(id: number, partType: PartTypeDTO): Observable<PartTypeResponse> {
    return this.http.put<PartTypeResponse>(`${this.partTypeUrl}/${id}`, partType);
  }

  /**
   * Delete a part type
   */
  deletePartType(id: number): Observable<void> {
    return this.http.delete<void>(`${this.partTypeUrl}/${id}`);
  }
}

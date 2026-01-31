import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserLogin } from '../../shared/models/user-login';
import { LoginRequest } from '../../shared/models/login-request';
import { LoginResponse } from '../../shared/models/login-response';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private loginUrl = `${environment.apiUrl}/auth/login`;
  private registerUrl = `${environment.apiUrl}/userslogin`;

  private _token: string | undefined;
  private _admin: boolean = false;
  private _username: string = '';

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.loginUrl}`, credentials);
  }

  register(userLogin: UserLogin): Observable<UserLogin> {
    const headers: any = {};
    const token = this.token;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return this.http.post<UserLogin>(`${this.registerUrl}`, userLogin, { headers });
  }

  setLoginData(token: string, username: string, admin: boolean) {
    this._token = token;
    this._username = username;
    this._admin = admin;

    sessionStorage.setItem('token', token);
    sessionStorage.setItem('username', username);
    sessionStorage.setItem('isAdmin', JSON.stringify(admin));
  }

  set token(token: string) {
    this._token = token;
    sessionStorage.setItem('token', token);
  }

  get token() {
    if (this._token) return this._token;
    this._token = sessionStorage.getItem('token') || '';
    return this._token;
  }

  get username() {
    if (!this._username && sessionStorage.getItem('username')) {
      this._username = sessionStorage.getItem('username')!;
    }
    return this._username;
  }

  isAdmin(): boolean {
    const stored = sessionStorage.getItem('isAdmin');
    return stored ? JSON.parse(stored) : false;
  }

  logout(): void {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('isAdmin');
  }

  isLoggedIn(): boolean {
    return !!sessionStorage.getItem('token');
  }
}
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { LoginRequest } from '../../shared/models/login-request';
import { LoginResponse } from '../../shared/models/login-response';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    // Clear sessionStorage before each test
    sessionStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should login successfully', () => {
    const mockCredentials: LoginRequest = {
      username: 'testuser',
      password: 'testpass123'
    };

    const mockResponse: LoginResponse = {
      message: 'Login successful',
      token: 'test-jwt-token',
      username: 'testuser',
      admin: false
    };

    service.login(mockCredentials).subscribe(response => {
      expect(response).toEqual(mockResponse);
      expect(response.token).toBe('test-jwt-token');
      expect(response.username).toBe('testuser');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockCredentials);
    req.flush(mockResponse);
  });

  it('should set login data in sessionStorage', () => {
    service.setLoginData('test-token', 'testuser', true);

    expect(sessionStorage.getItem('token')).toBe('test-token');
    expect(sessionStorage.getItem('username')).toBe('testuser');
    expect(sessionStorage.getItem('isAdmin')).toBe('true');
  });

  it('should get token from sessionStorage', () => {
    sessionStorage.setItem('token', 'stored-token');
    expect(service.token).toBe('stored-token');
  });

  it('should get username from sessionStorage', () => {
    sessionStorage.setItem('username', 'storeduser');
    expect(service.username).toBe('storeduser');
  });

  it('should check if user is admin', () => {
    sessionStorage.setItem('isAdmin', 'true');
    expect(service.isAdmin()).toBe(true);

    sessionStorage.setItem('isAdmin', 'false');
    expect(service.isAdmin()).toBe(false);
  });

  it('should check if user is logged in', () => {
    expect(service.isLoggedIn()).toBe(false);

    sessionStorage.setItem('token', 'test-token');
    expect(service.isLoggedIn()).toBe(true);
  });

  it('should logout and clear sessionStorage', () => {
    sessionStorage.setItem('token', 'test-token');
    sessionStorage.setItem('username', 'testuser');
    sessionStorage.setItem('isAdmin', 'true');

    service.logout();

    expect(sessionStorage.getItem('token')).toBeNull();
    expect(sessionStorage.getItem('username')).toBeNull();
    expect(sessionStorage.getItem('isAdmin')).toBeNull();
  });

  it('should set token in sessionStorage', () => {
    service.token = 'new-token';
    expect(sessionStorage.getItem('token')).toBe('new-token');
  });
});

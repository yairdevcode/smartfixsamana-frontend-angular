import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { tokenInterceptor } from './token.interceptor';
import { AuthService } from '../services/auth.service';

/**
 * Caso FRT-003 del plan de pruebas GA9-220501096-AA1-EV02.
 *
 * Verifica que toda petición saliente lleve la cabecera Authorization con el
 * token de la sesión, que el resto de la petición no se altere y que las
 * cabeceras propias de cada llamada se conserven.
 */
describe('tokenInterceptor - cabecera de autorización (FRT-003)', () => {
  const URL = '/api/customers';

  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([tokenInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  const conSesionActiva = (token: string) => {
    TestBed.inject(AuthService).token = token;
  };

  it('adjunta la cabecera Authorization cuando hay token de sesión', () => {
    conSesionActiva('token-de-prueba');

    http.get(URL).subscribe();

    const peticion = httpMock.expectOne(URL);
    expect(peticion.request.headers.has('Authorization')).toBeTrue();
    peticion.flush({});
  });

  it('usa el esquema Bearer seguido del token', () => {
    conSesionActiva('token-de-prueba');

    http.get(URL).subscribe();

    const peticion = httpMock.expectOne(URL);
    expect(peticion.request.headers.get('Authorization')).toBe('Bearer token-de-prueba');
    peticion.flush({});
  });

  it('adjunta el token también en las peticiones POST', () => {
    conSesionActiva('token-de-prueba');

    http.post(URL, { name: 'Cliente de prueba' }).subscribe();

    const peticion = httpMock.expectOne(URL);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.headers.get('Authorization')).toBe('Bearer token-de-prueba');
    peticion.flush({});
  });

  it('conserva las cabeceras propias de la petición original', () => {
    conSesionActiva('token-de-prueba');

    http.get(URL, { headers: { 'X-Origen': 'prueba-automatizada' } }).subscribe();

    const peticion = httpMock.expectOne(URL);
    expect(peticion.request.headers.get('X-Origen')).toBe('prueba-automatizada');
    expect(peticion.request.headers.get('Authorization')).toBe('Bearer token-de-prueba');
    peticion.flush({});
  });

  it('no altera la url ni el cuerpo de la petición', () => {
    conSesionActiva('token-de-prueba');
    const cuerpo = { name: 'Cliente de prueba', phone: '3001234567' };

    http.post(URL, cuerpo).subscribe();

    const peticion = httpMock.expectOne(URL);
    expect(peticion.request.url).toBe(URL);
    expect(peticion.request.body).toEqual(cuerpo);
    peticion.flush({});
  });

  it('un token renovado reemplaza al anterior en la siguiente petición', () => {
    conSesionActiva('token-inicial');
    http.get(URL).subscribe();
    httpMock.expectOne(URL).flush({});

    conSesionActiva('token-renovado');
    http.get(URL).subscribe();

    const segunda = httpMock.expectOne(URL);
    expect(segunda.request.headers.get('Authorization')).toBe('Bearer token-renovado');
    segunda.flush({});
  });

  /*
   * Comportamiento actual sin sesión activa, registrado como defecto DEF-004.
   *
   * El getter AuthService.token devuelve cadena vacía cuando no hay nada en
   * sessionStorage, y la condición del interceptor es `token != undefined`,
   * que la cadena vacía satisface. El resultado es una cabecera "Bearer " sin
   * token en peticiones anónimas.
   *
   * Cuando se corrija el interceptor cambiando la condición a `if (token)`,
   * esta prueba debe pasar a esperar que la cabecera no exista:
   *   expect(peticion.request.headers.has('Authorization')).toBeFalse();
   */
  it('sin sesión activa envía la cabecera vacía (DEF-004, pendiente de corrección)', () => {
    http.get(URL).subscribe();

    const peticion = httpMock.expectOne(URL);
    expect(peticion.request.headers.get('Authorization')).toBe('Bearer ');
    peticion.flush({});
  });
});

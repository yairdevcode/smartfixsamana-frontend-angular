import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';

import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

/**
 * Caso FRT-002 del plan de pruebas GA9-220501096-AA1-EV02.
 *
 * Verifica que el guard permita el paso solo cuando hay sesión activa y que,
 * en caso contrario, bloquee la navegación y redirija al inicio de sesión.
 */
describe('authGuard - protección de rutas (FRT-002)', () => {
  let router: jasmine.SpyObj<Router>;
  let authService: jasmine.SpyObj<AuthService>;

  /** El guard es una función con inyección, así que debe correr dentro del contexto. */
  const ejecutarGuard = () =>
    TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

  beforeEach(() => {
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['isLoggedIn']);

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: authService },
      ],
    });
  });

  it('permite el acceso cuando hay una sesión activa', () => {
    authService.isLoggedIn.and.returnValue(true);

    expect(ejecutarGuard()).toBeTrue();
  });

  it('no redirige cuando hay una sesión activa', () => {
    authService.isLoggedIn.and.returnValue(true);

    ejecutarGuard();

    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('bloquea el acceso cuando no hay sesión activa', () => {
    authService.isLoggedIn.and.returnValue(false);

    expect(ejecutarGuard()).toBeFalse();
  });

  it('redirige al inicio de sesión cuando no hay sesión activa', () => {
    authService.isLoggedIn.and.returnValue(false);

    ejecutarGuard();

    expect(router.navigate).toHaveBeenCalledOnceWith(['/login']);
  });

  it('consulta el estado de la sesión en cada navegación', () => {
    authService.isLoggedIn.and.returnValue(true);

    ejecutarGuard();
    ejecutarGuard();

    expect(authService.isLoggedIn).toHaveBeenCalledTimes(2);
  });
});

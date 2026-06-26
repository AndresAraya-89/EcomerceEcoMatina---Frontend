import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';

import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

/**
 * El guard es una funcion: se ejecuta dentro de un contexto de inyeccion para
 * que `inject()` resuelva. Se le da un AuthService falso con la senal de sesion
 * controlada y se observa la decision (true vs. redireccion al login).
 */
describe('authGuard', () => {
  const ejecutar = (autenticado: boolean, url = '/perfil') => {
    const auth = { estaAutenticado: signal(autenticado) } as Partial<AuthService>;
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: auth }],
    });
    const state = { url } as RouterStateSnapshot;
    const route = {} as ActivatedRouteSnapshot;
    return TestBed.runInInjectionContext(() => authGuard(route, state));
  };

  it('permite el paso con sesion activa', () => {
    expect(ejecutar(true)).toBeTrue();
  });

  it('sin sesion redirige al login conservando la URL destino en returnUrl', () => {
    const resultado = ejecutar(false, '/perfil');
    expect(resultado instanceof UrlTree).toBeTrue();

    const esperado = TestBed.inject(Router).createUrlTree(['/auth'], {
      queryParams: { returnUrl: '/perfil' },
    });
    expect((resultado as UrlTree).toString()).toBe(esperado.toString());
  });
});

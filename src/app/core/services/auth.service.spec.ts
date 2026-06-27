import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { AuthService } from './auth.service';
import { AuthApiService } from './auth-api.service';
import { TokenStorageService } from './token-storage.service';
import { buildTokenResponse, buildUsuarioActual } from '../../testing';

/**
 * Tests del facade de sesion. Se aisla con dobles: un `AuthApiService` espiado
 * (sin HTTP) y un `TokenStorageService` espiado (sin localStorage). Se prueban
 * las reglas de sesion (persistir tokens, hidratar /me, dedup del refresh), no el
 * transporte ni el storage, que tienen sus propios specs. Las respuestas usan
 * `of()/throwError()` para resolver de forma sincrona.
 */
describe('AuthService (facade)', () => {
  let api: jasmine.SpyObj<AuthApiService>;
  let storage: jasmine.SpyObj<TokenStorageService>;

  /** Construye el facade con los dobles ya configurados para cada test. */
  function crearServicio(): AuthService {
    return TestBed.inject(AuthService);
  }

  beforeEach(() => {
    api = jasmine.createSpyObj<AuthApiService>('AuthApiService', [
      'login',
      'registrar',
      'logout',
      'refrescar',
      'obtenerUsuarioActual',
    ]);
    storage = jasmine.createSpyObj<TokenStorageService>('TokenStorageService', [
      'tieneSesion',
      'accessToken',
      'refreshToken',
      'guardar',
      'limpiar',
    ]);
    // Por defecto: sin sesion previa (el constructor no hidrata /me).
    storage.tieneSesion.and.returnValue(false);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthApiService, useValue: api },
        { provide: TokenStorageService, useValue: storage },
      ],
    });
  });

  describe('login', () => {
    it('guarda los tokens, hidrata la identidad y marca la sesion activa', () => {
      api.login.and.returnValue(of(buildTokenResponse()));
      api.obtenerUsuarioActual.and.returnValue(of(buildUsuarioActual({ correo: 'ana@x.com' })));

      const service = crearServicio();
      let recibido: unknown;
      service.login({ correo: 'ana@x.com', clave: 'Secreta12' }).subscribe((u) => (recibido = u));

      expect(storage.guardar).toHaveBeenCalled();
      expect(service.estaAutenticado()).toBeTrue();
      expect(service.usuario()?.correo).toBe('ana@x.com');
      expect(recibido).toEqual(buildUsuarioActual({ correo: 'ana@x.com' }));
      expect(service.cargando()).toBeFalse();
    });

    it('ante credenciales invalidas propaga el error y no guarda tokens', () => {
      api.login.and.returnValue(throwError(() => ({ error: { detail: 'Credenciales' } })));

      const service = crearServicio();
      let errorRecibido = false;
      service.login({ correo: 'x', clave: 'y' }).subscribe({ error: () => (errorRecibido = true) });

      expect(errorRecibido).toBeTrue();
      expect(storage.guardar).not.toHaveBeenCalled();
      expect(service.estaAutenticado()).toBeFalse();
      expect(service.cargando()).toBeFalse();
    });
  });

  describe('logout', () => {
    it('limpia el estado local tras avisar al backend', () => {
      api.logout.and.returnValue(of({ mensaje: 'ok' }));

      const service = crearServicio();
      service.logout();

      expect(storage.limpiar).toHaveBeenCalled();
      expect(service.estaAutenticado()).toBeFalse();
      expect(service.usuario()).toBeNull();
    });

    it('limpia el estado local aunque el backend falle', () => {
      api.logout.and.returnValue(throwError(() => new Error('sin red')));

      const service = crearServicio();
      service.logout();

      expect(storage.limpiar).toHaveBeenCalled();
      expect(service.estaAutenticado()).toBeFalse();
    });
  });

  describe('renovarSesion', () => {
    it('renueva con el refresh token, persiste el par nuevo y emite el access', () => {
      storage.refreshToken.and.returnValue('REFRESH-1');
      api.refrescar.and.returnValue(of(buildTokenResponse({ access_token: 'NUEVO-ACCESS' })));

      const service = crearServicio();
      let token: unknown;
      service.renovarSesion().subscribe((t) => (token = t));

      expect(api.refrescar).toHaveBeenCalledWith({ refresh_token: 'REFRESH-1' });
      expect(storage.guardar).toHaveBeenCalled();
      expect(token).toBe('NUEVO-ACCESS');
    });

    it('sin refresh token cierra la sesion local y emite error', () => {
      storage.refreshToken.and.returnValue(null);

      const service = crearServicio();
      let errorRecibido = false;
      service.renovarSesion().subscribe({ error: () => (errorRecibido = true) });

      expect(errorRecibido).toBeTrue();
      expect(storage.limpiar).toHaveBeenCalled();
      expect(api.refrescar).not.toHaveBeenCalled();
    });

    it('si el backend rechaza el refresh (401) cierra la sesion local', () => {
      storage.refreshToken.and.returnValue('REFRESH-ROTADO');
      api.refrescar.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' })),
      );

      const service = crearServicio();
      let errorRecibido = false;
      service.renovarSesion().subscribe({ error: () => (errorRecibido = true) });

      expect(errorRecibido).toBeTrue();
      expect(storage.limpiar).toHaveBeenCalled();
    });

    it('si el refresh falla por error transitorio (5xx) CONSERVA la sesion', () => {
      storage.refreshToken.and.returnValue('REFRESH-1');
      api.refrescar.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 503, statusText: 'Service Unavailable' })),
      );

      const service = crearServicio();
      let errorRecibido = false;
      service.renovarSesion().subscribe({ error: () => (errorRecibido = true) });

      expect(errorRecibido).toBeTrue();
      // No se desloguea ante un hipo de red/servidor: los tokens siguen validos.
      expect(storage.limpiar).not.toHaveBeenCalled();
    });

    it('deduplica renovaciones concurrentes: una sola peticion /refresh', () => {
      storage.refreshToken.and.returnValue('REFRESH-1');
      api.refrescar.and.returnValue(of(buildTokenResponse({ access_token: 'NUEVO' })));

      const service = crearServicio();
      // Dos llamadas antes de suscribir comparten el mismo Observable en vuelo.
      const o1 = service.renovarSesion();
      const o2 = service.renovarSesion();
      o1.subscribe();
      o2.subscribe();

      expect(api.refrescar).toHaveBeenCalledTimes(1);
    });
  });

  describe('hidratacion al arrancar', () => {
    it('si hay sesion guardada, resuelve la identidad desde /me', () => {
      storage.tieneSesion.and.returnValue(true);
      api.obtenerUsuarioActual.and.returnValue(of(buildUsuarioActual({ correo: 'persistida@x.com' })));

      const service = crearServicio();

      expect(service.usuario()?.correo).toBe('persistida@x.com');
      expect(service.estaAutenticado()).toBeTrue();
    });

    it('si /me es rechazado por credenciales (401) al arrancar, cierra la sesion local', () => {
      storage.tieneSesion.and.returnValue(true);
      api.obtenerUsuarioActual.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' })),
      );

      const service = crearServicio();

      expect(storage.limpiar).toHaveBeenCalled();
      expect(service.estaAutenticado()).toBeFalse();
      expect(service.usuario()).toBeNull();
    });

    it('si /me falla por error transitorio (5xx) al arrancar, CONSERVA la sesion', () => {
      storage.tieneSesion.and.returnValue(true);
      api.obtenerUsuarioActual.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 500, statusText: 'Server Error' })),
      );

      const service = crearServicio();

      // Un hipo al volver de PayPal no debe desloguear: los tokens siguen validos.
      expect(storage.limpiar).not.toHaveBeenCalled();
      expect(service.estaAutenticado()).toBeTrue();
    });
  });
});

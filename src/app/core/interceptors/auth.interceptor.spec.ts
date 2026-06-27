import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { TokenStorageService } from '../services/token-storage.service';
import { environment } from '../../../environments/environment';

/**
 * Tests del interceptor de seguridad. Se monta el HttpClient real con el
 * interceptor registrado y `HttpTestingController` (sin red). AuthService y
 * TokenStorageService son dobles para controlar token y renovacion.
 */
describe('authInterceptor', () => {
  let http: HttpTestingController;
  let client: HttpClient;
  let auth: jasmine.SpyObj<AuthService>;
  let storage: jasmine.SpyObj<TokenStorageService>;

  const PROTEGIDA = `${environment.apiUrl}/products`;
  const PUBLICA = `${environment.apiUrl}/auth/login`;

  beforeEach(() => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', [
      'renovarSesion',
      'cerrarSesionLocal',
    ]);
    storage = jasmine.createSpyObj<TokenStorageService>('TokenStorageService', ['accessToken']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: auth },
        { provide: TokenStorageService, useValue: storage },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    client = TestBed.inject(HttpClient);
  });

  afterEach(() => http.verify());

  it('adjunta el Bearer a una ruta protegida cuando hay token', () => {
    storage.accessToken.and.returnValue('tok-123');

    client.get(PROTEGIDA).subscribe();
    const req = http.expectOne(PROTEGIDA);

    expect(req.request.headers.get('Authorization')).toBe('Bearer tok-123');
    req.flush([]);
  });

  it('NO adjunta Bearer a una ruta publica (login) aunque haya token', () => {
    storage.accessToken.and.returnValue('tok-123');

    client.post(PUBLICA, {}).subscribe();
    const req = http.expectOne(PUBLICA);

    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('si no hay token, no agrega el header', () => {
    storage.accessToken.and.returnValue(null);

    client.get(PROTEGIDA).subscribe();
    const req = http.expectOne(PROTEGIDA);

    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush([]);
  });

  it('ante un 401 renueva la sesion y reintenta con el token nuevo', () => {
    storage.accessToken.and.returnValue('viejo');
    auth.renovarSesion.and.returnValue(of('nuevo'));

    let resultado: any;
    client.get(PROTEGIDA).subscribe((r) => (resultado = r));

    const primero = http.expectOne(PROTEGIDA);
    expect(primero.request.headers.get('Authorization')).toBe('Bearer viejo');
    primero.flush({ detail: 'token vencido' }, { status: 401, statusText: 'Unauthorized' });

    const reintento = http.expectOne(PROTEGIDA);
    expect(reintento.request.headers.get('Authorization')).toBe('Bearer nuevo');
    reintento.flush({ ok: true });

    expect(resultado).toEqual({ ok: true });
    expect(auth.renovarSesion).toHaveBeenCalledTimes(1);
  });

  it('si la renovacion falla, propaga el error (el cierre de sesion lo decide AuthService)', () => {
    storage.accessToken.and.returnValue('viejo');
    auth.renovarSesion.and.returnValue(throwError(() => new Error('sesion expirada')));

    let errorRecibido = false;
    client.get(PROTEGIDA).subscribe({ error: () => (errorRecibido = true) });

    const req = http.expectOne(PROTEGIDA);
    req.flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(errorRecibido).toBeTrue();
    // El interceptor ya no cierra sesion: esa decision vive en renovarSesion.
    expect(auth.cerrarSesionLocal).not.toHaveBeenCalled();
  });

  it('un error que no es 401 se propaga sin intentar renovar', () => {
    storage.accessToken.and.returnValue('viejo');

    let errorRecibido = false;
    client.get(PROTEGIDA).subscribe({ error: () => (errorRecibido = true) });

    const req = http.expectOne(PROTEGIDA);
    req.flush(null, { status: 500, statusText: 'Server Error' });

    expect(errorRecibido).toBeTrue();
    expect(auth.renovarSesion).not.toHaveBeenCalled();
  });

  it('un 401 sin token previo se propaga sin intentar renovar', () => {
    storage.accessToken.and.returnValue(null);

    let errorRecibido = false;
    client.get(PROTEGIDA).subscribe({ error: () => (errorRecibido = true) });

    const req = http.expectOne(PROTEGIDA);
    req.flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(errorRecibido).toBeTrue();
    expect(auth.renovarSesion).not.toHaveBeenCalled();
  });
});

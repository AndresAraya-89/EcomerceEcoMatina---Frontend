import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';

import { Login } from './login';
import { AuthService } from '../../../core/services/auth.service';
import { TokenStorageService } from '../../../core/services/token-storage.service';
import { authInterceptor } from '../../../core/interceptors/auth.interceptor';
import { environment } from '../../../../environments/environment';
import { buildTokenResponse, buildUsuarioActual } from '../../../testing';

/**
 * Pruebas de INTEGRACION del inicio de sesión: se montan juntos el componente
 * `Login`, el `AuthService` (facade), el `AuthApiService`, el interceptor de
 * seguridad y el `TokenStorageService` REALES, con la frontera HTTP simulada.
 * Verifican el flujo completo: login -> guardar tokens -> hidratar /me, y que el
 * interceptor adjunte el Bearer ya guardado a la llamada protegida (/me).
 */
describe('Login [integracion]', () => {
  let fixture: ComponentFixture<Login>;
  let http: HttpTestingController;
  let auth: AuthService;
  let tokens: TokenStorageService;
  let router: Router;

  const base = environment.apiUrl;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    http = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    tokens = TestBed.inject(TokenStorageService);
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);

    fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('credenciales válidas: inicia sesión, hidrata la identidad y navega al inicio', async () => {
    const comp = fixture.componentInstance;
    comp.form.setValue({ correo: 'cliente@ejemplo.com', clave: 'Secreta123' });
    fixture.detectChanges();

    // Enviar el formulario desde la plantilla.
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      'button[type=submit]',
    )!.click();

    // 1) POST /auth/login: ruta pública, el interceptor NO debe poner Bearer.
    const login = http.expectOne(`${base}/auth/login`);
    expect(login.request.method).toBe('POST');
    expect(login.request.body).toEqual({ correo: 'cliente@ejemplo.com', clave: 'Secreta123' });
    expect(login.request.headers.has('Authorization')).toBeFalse();
    login.flush(buildTokenResponse({ access_token: 'acc-1', refresh_token: 'ref-1' }));

    await fixture.whenStable();

    // 2) GET /auth/me: ruta protegida; el interceptor adjunta el token recién guardado.
    const me = http.expectOne(`${base}/auth/me`);
    expect(me.request.headers.get('Authorization')).toBe('Bearer acc-1');
    me.flush(buildUsuarioActual({ correo: 'cliente@ejemplo.com', cliente_id: 7 }));

    await fixture.whenStable();

    // Estado final: tokens persistidos, sesión activa y navegación al destino.
    expect(tokens.accessToken()).toBe('acc-1');
    expect(auth.estaAutenticado()).toBeTrue();
    expect(auth.usuario()?.correo).toBe('cliente@ejemplo.com');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/inicio');
  });

  it('credenciales inválidas: muestra el error y no guarda sesión', async () => {
    const comp = fixture.componentInstance;
    comp.form.setValue({ correo: 'cliente@ejemplo.com', clave: 'mala' });
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      'button[type=submit]',
    )!.click();

    http
      .expectOne(`${base}/auth/login`)
      .flush({ detail: 'Credenciales inválidas' }, { status: 401, statusText: 'Unauthorized' });

    await fixture.whenStable();
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Credenciales inválidas');
    expect(tokens.accessToken()).toBeNull();
    expect(auth.estaAutenticado()).toBeFalse();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});

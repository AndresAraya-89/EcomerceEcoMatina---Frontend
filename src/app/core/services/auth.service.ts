import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, shareReplay, switchMap, tap, throwError } from 'rxjs';

import {
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  TokenResponse,
  UsuarioActual,
} from '../models/auth.models';
import { esFalloDeAutenticacion } from '../utils/auth-error';
import { AuthApiService } from './auth-api.service';
import { TokenStorageService } from './token-storage.service';

/**
 * Estado y reglas de la sesion (patron Facade + store con signals).
 *
 * Es la unica puerta de entrada para los componentes (login, registro, header,
 * guards). Mantiene el estado reactivo y delega:
 *   - el transporte HTTP en AuthApiService (SRP)
 *   - la persistencia de tokens en TokenStorageService (SRP / DIP)
 *
 * Distingue dos conceptos:
 *   - `estaAutenticado`: hay un par de tokens guardado (sincrono, sirve al guard
 *     incluso en frio, antes de resolver /me).
 *   - `usuario`: la identidad ya resuelta contra /me (puede tardar un tick).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(AuthApiService);
  private readonly storage = inject(TokenStorageService);

  // ── Estado privado escribible ──────────────────────────────────────────
  private readonly _usuario = signal<UsuarioActual | null>(null);
  private readonly _sesionActiva = signal<boolean>(this.storage.tieneSesion());
  private readonly _cargando = signal(false);

  // ── Estado publico de solo lectura ─────────────────────────────────────
  /** Identidad del usuario autenticado (null hasta resolver /me). */
  readonly usuario = this._usuario.asReadonly();
  /** True mientras hay una operacion de auth en curso (login/registro). */
  readonly cargando = this._cargando.asReadonly();
  /** True si hay tokens guardados. Base sincrona para el guard. */
  readonly estaAutenticado = computed(() => this._sesionActiva());
  /** Rol del usuario actual (cliente/admin), util para vistas condicionales. */
  readonly rol = computed(() => this._usuario()?.rol ?? null);

  /**
   * Refresh en vuelo compartido: dedup de renovaciones concurrentes. Si varias
   * peticiones reciben 401 a la vez, todas esperan el mismo /refresh en lugar de
   * dispararlo N veces (que rotaria el token N veces e invalidaria a las demas).
   */
  private renovacionEnCurso: Observable<string> | null = null;

  constructor() {
    // Si arrancamos con tokens guardados, hidratamos la identidad desde /me.
    // Solo cerramos la sesion si /me (o su refresh transparente) la rechaza de
    // verdad (401/403). Ante un fallo transitorio (sin red, 5xx) conservamos los
    // tokens: siguen siendo validos y volveremos a resolver /me mas tarde. Asi un
    // arranque en frio al volver de PayPal no desloguea al usuario.
    if (this._sesionActiva()) {
      this.cargarUsuario().subscribe({
        error: (err) => {
          if (esFalloDeAutenticacion(err)) {
            this.cerrarSesionLocal();
          }
        },
      });
    }
  }

  /**
   * Inicia sesion: guarda los tokens y resuelve la identidad (/me).
   * Retorna un Observable para que el componente decida la navegacion; el estado
   * global (usuario, sesion) lo actualiza este facade.
   */
  login(data: LoginRequest): Observable<UsuarioActual> {
    this._cargando.set(true);
    return this.api.login(data).pipe(
      tap((tokens) => this.guardarSesion(tokens)),
      // Encadena /me para tener la identidad lista al navegar.
      switchMap(() => this.cargarUsuario()),
      finalize(() => this._cargando.set(false)),
    );
  }

  /** Registra un nuevo usuario. No inicia sesion: la cuenta nace no_verificada. */
  registrar(data: RegisterRequest): Observable<RegisterResponse> {
    this._cargando.set(true);
    return this.api.registrar(data).pipe(finalize(() => this._cargando.set(false)));
  }

  /**
   * Cierra sesion: avisa al backend (invalida el refresh) y limpia el estado
   * local pase lo que pase con la peticion (la sesion del usuario termina ya).
   */
  logout(): void {
    this.api.logout().subscribe({
      next: () => this.cerrarSesionLocal(),
      error: () => this.cerrarSesionLocal(),
    });
  }

  /**
   * Renueva el access token usando el refresh guardado. Comparte la peticion en
   * vuelo entre llamadas concurrentes (lo usa el interceptor ante un 401).
   * Emite el nuevo access token ya persistido.
   */
  renovarSesion(): Observable<string> {
    if (this.renovacionEnCurso) {
      return this.renovacionEnCurso;
    }

    const refreshToken = this.storage.refreshToken();
    if (!refreshToken) {
      this.cerrarSesionLocal();
      return new Observable<string>((sub) => sub.error(new Error('Sesion expirada')));
    }

    this.renovacionEnCurso = this.api.refrescar({ refresh_token: refreshToken }).pipe(
      tap((tokens) => this.guardarSesion(tokens)),
      map((tokens) => tokens.access_token),
      catchError((error: unknown) => {
        // El backend rechazo el refresh (token rotado/vencido/revocado): la
        // sesion termino y hay que cerrarla. Ante un fallo transitorio (sin red,
        // 5xx) NO cerramos: conservamos los tokens para reintentar sin obligar a
        // re-login (clave al volver de PayPal). El interceptor solo propaga.
        if (esFalloDeAutenticacion(error)) {
          this.cerrarSesionLocal();
        }
        return throwError(() => error);
      }),
      finalize(() => (this.renovacionEnCurso = null)),
      shareReplay(1),
    );
    return this.renovacionEnCurso;
  }

  /** Recarga la identidad del usuario desde /me y la publica en el signal. */
  cargarUsuario(): Observable<UsuarioActual> {
    return this.api.obtenerUsuarioActual().pipe(tap((usuario) => this._usuario.set(usuario)));
  }

  /** Limpia tokens y estado local sin tocar el backend (refresh invalido / logout). */
  cerrarSesionLocal(): void {
    this.storage.limpiar();
    this._usuario.set(null);
    this._sesionActiva.set(false);
  }

  // ── Privados ──────────────────────────────────────────────────────────────

  /** Persiste el par de tokens y marca la sesion como activa. */
  private guardarSesion(tokens: TokenResponse): void {
    this.storage.guardar(tokens);
    this._sesionActiva.set(true);
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ActualizarPerfilRequest,
  ActualizarPerfilResponse,
  CambiarContrasenaRequest,
  CorreoRequest,
  LoginRequest,
  MensajeResponse,
  Perfil,
  RefreshRequest,
  RegisterRequest,
  RegisterResponse,
  ResetearContrasenaRequest,
  TokenRequest,
  TokenResponse,
  UsuarioActual,
} from '../models/auth.models';

/**
 * Acceso HTTP al modulo de seguridad (`auth`).
 *
 * Responsabilidad unica (SRP): hablar con `/api/v1/auth`. No guarda estado ni
 * conoce los tokens; los componentes nunca lo usan directo (pasan por
 * AuthService, que es la fachada). El Authorization: Bearer lo agrega el
 * interceptor, no este servicio: aqui solo se arman las peticiones.
 */
@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/auth`;

  // ── Sesion / cuenta ───────────────────────────────────────────────────────

  /** POST /register — crea cliente + usuario y dispara el correo de verificacion. */
  registrar(data: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.url}/register`, data);
  }

  /** POST /login — valida credenciales y entrega access + refresh token. */
  login(data: LoginRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.url}/login`, data);
  }

  /** POST /refresh — renueva el access y rota el refresh (el anterior se invalida). */
  refrescar(data: RefreshRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.url}/refresh`, data);
  }

  /** POST /logout — invalida el refresh token del usuario en el backend. */
  logout(): Observable<MensajeResponse> {
    return this.http.post<MensajeResponse>(`${this.url}/logout`, {});
  }

  /** POST /verify-account — activa la cuenta con el token del correo (CU-07). */
  verificarCuenta(data: TokenRequest): Observable<MensajeResponse> {
    return this.http.post<MensajeResponse>(`${this.url}/verify-account`, data);
  }

  /** POST /resend-verification — reenvia el enlace de verificacion (anti-enumeracion). */
  reenviarVerificacion(data: CorreoRequest): Observable<MensajeResponse> {
    return this.http.post<MensajeResponse>(`${this.url}/resend-verification`, data);
  }

  // ── Contrasena ──────────────────────────────────────────────────────────

  /** POST /forgot-password — solicita el enlace de recuperacion (CU-10). */
  solicitarRecuperacion(data: CorreoRequest): Observable<MensajeResponse> {
    return this.http.post<MensajeResponse>(`${this.url}/forgot-password`, data);
  }

  /** POST /reset-password — establece la nueva clave con el token del correo. */
  resetearContrasena(data: ResetearContrasenaRequest): Observable<MensajeResponse> {
    return this.http.post<MensajeResponse>(`${this.url}/reset-password`, data);
  }

  /** POST /change-password — cambia la clave del usuario autenticado. */
  cambiarContrasena(data: CambiarContrasenaRequest): Observable<MensajeResponse> {
    return this.http.post<MensajeResponse>(`${this.url}/change-password`, data);
  }

  // ── Perfil (CU-19) ────────────────────────────────────────────────────────

  /** GET /me — identidad del usuario del token activo. */
  obtenerUsuarioActual(): Observable<UsuarioActual> {
    return this.http.get<UsuarioActual>(`${this.url}/me`);
  }

  /** GET /profile — datos personales completos del cliente. */
  obtenerPerfil(): Observable<Perfil> {
    return this.http.get<Perfil>(`${this.url}/profile`);
  }

  /** PUT /profile — actualiza nombre/telefono; si cambia el correo, queda pendiente. */
  actualizarPerfil(data: ActualizarPerfilRequest): Observable<ActualizarPerfilResponse> {
    return this.http.put<ActualizarPerfilResponse>(`${this.url}/profile`, data);
  }

  /** POST /confirm-email-change — confirma el nuevo correo con el token enviado. */
  confirmarCambioCorreo(data: TokenRequest): Observable<MensajeResponse> {
    return this.http.post<MensajeResponse>(`${this.url}/confirm-email-change`, data);
  }
}

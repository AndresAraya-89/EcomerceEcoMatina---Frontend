import { Injectable } from '@angular/core';

import { TokenResponse } from '../models/auth.models';

const ACCESS_TOKEN_KEY = 'agromatina_access_token';
const REFRESH_TOKEN_KEY = 'agromatina_refresh_token';

/**
 * Persistencia de los tokens de sesion en localStorage.
 *
 * Responsabilidad unica (SRP): leer/escribir/borrar los tokens. Aislar el
 * mecanismo permite cambiarlo (cookies httpOnly, sessionStorage) sin tocar la
 * logica de autenticacion del AuthService (DIP: el facade depende de esta
 * abstraccion, no de `localStorage` directamente).
 *
 * Se usa localStorage (no sessionStorage como el carrito) para que la sesion
 * sobreviva al refresco de pagina y al cierre de pestana, en linea con el
 * `tk_refresh` / `ultimo_acceso` que mantiene el backend.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  /** Access token (JWT) para el header Authorization, o null si no hay sesion. */
  accessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  /** Refresh token opaco para renovar el access expirado, o null. */
  refreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  /** True si hay un par de tokens guardado (no garantiza que sigan vigentes). */
  tieneSesion(): boolean {
    return this.accessToken() !== null && this.refreshToken() !== null;
  }

  /** Guarda el par de tokens emitido por /login o /refresh. */
  guardar(tokens: TokenResponse): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
  }

  /** Borra los tokens (cierre de sesion o refresh invalido). */
  limpiar(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

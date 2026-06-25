import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { TokenStorageService } from '../services/token-storage.service';

/**
 * Rutas publicas de `auth` que NO llevan Bearer ni reintento por refresh:
 * son las que emiten o no dependen de la sesion (login, registro, refresh,
 * recuperacion, verificacion). Enviarles un token vencido o reintentar un
 * /refresh ante su propio 401 solo crearia ruido o bucles.
 */
const RUTAS_SIN_TOKEN = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-account',
  '/auth/resend-verification',
  '/auth/confirm-email-change',
];

/** Agrega el header Authorization: Bearer al clonar la peticion. */
function conToken<T>(req: HttpRequest<T>, token: string): HttpRequest<T> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

/**
 * Interceptor de seguridad (patron Chain of Responsibility de HttpClient).
 *
 * 1. Adjunta el access token a las peticiones protegidas.
 * 2. Ante un 401, intenta renovar la sesion una sola vez (AuthService dedup los
 *    refresh concurrentes) y reintenta la peticion original con el token nuevo.
 *    Si el refresh tambien falla, cierra la sesion local y propaga el error.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const storage = inject(TokenStorageService);

  const esRutaPublica = RUTAS_SIN_TOKEN.some((ruta) => req.url.includes(ruta));
  if (esRutaPublica) {
    return next(req);
  }

  const token = storage.accessToken();
  const peticion = token ? conToken(req, token) : req;

  return next(peticion).pipe(
    catchError((error: HttpErrorResponse) => {
      // Solo intentamos renovar si habia token y el rechazo fue 401.
      if (error.status !== 401 || !token) {
        return throwError(() => error);
      }
      return auth.renovarSesion().pipe(
        switchMap((nuevoToken) => next(conToken(req, nuevoToken))),
        catchError((errorRefresh) => {
          auth.cerrarSesionLocal();
          return throwError(() => errorRefresh);
        }),
      );
    }),
  );
};

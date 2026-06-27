import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * Guard funcional para rutas protegidas (CU-12: Mis Facturas, Mi Perfil, etc.).
 *
 * Permite el paso si hay sesion activa (tokens presentes). Si no, redirige al
 * login conservando la URL destino en `returnUrl` para volver tras autenticarse.
 * La validez real del token la verifica el backend; si esta vencido, el
 * interceptor intentara renovarlo de forma transparente.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.estaAutenticado()) {
    return true;
  }

  return router.createUrlTree(['/auth'], {
    queryParams: { returnUrl: state.url },
  });
};

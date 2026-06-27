import { HttpErrorResponse } from '@angular/common/http';

/**
 * Distingue un rechazo de autenticación REAL de un fallo transitorio.
 *
 * Solo un 401/403 del backend significa que la credencial dejó de ser válida
 * (access/refresh vencido, rotado o revocado): ahí la sesión terminó de verdad y
 * corresponde cerrarla. Un fallo transitorio (sin red `status 0`, 5xx, timeout)
 * NO invalida la sesión; los tokens siguen sirviendo y conviene reintentar en
 * lugar de desloguear al usuario.
 *
 * Esta distinción es la que evita que un hipo al volver de PayPal (arranque en
 * frío con varias peticiones a la vez) borre la sesión recién usada.
 */
export function esFalloDeAutenticacion(error: unknown): boolean {
  return error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403);
}

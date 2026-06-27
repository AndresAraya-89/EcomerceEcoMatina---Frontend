/**
 * Builders de datos de prueba (patron "Object Mother" / Test Data Builder).
 *
 * Centralizan la construccion de objetos de dominio para los tests (DRY): cada
 * builder entrega un objeto valido por defecto y acepta `overrides` para ajustar
 * solo lo relevante a cada caso. Asi los `*.spec.ts` describen QUE se prueba sin
 * ahogarse en como armar el dato.
 *
 *   const item = buildCartItem({ cantidad: 3 });
 *
 * Si cambia un contrato del backend, se actualiza el builder en un solo lugar y
 * no decenas de specs.
 */
import { CartItem, ItemValidadoResponse, ResumenCarritoResponse } from '../core/models/cart.models';
import { TokenResponse, UsuarioActual } from '../core/models/auth.models';

/** Item del carrito tal como lo guarda el frontend. */
export function buildCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    codigo_producto: 'PROD-001',
    nombre: 'Motobomba 2"',
    precio_unitario: 100,
    cantidad: 1,
    subtotal: 100,
    ...overrides,
  };
}

/** Respuesta de /cart/validate-item (precio/stock validado por el backend). */
export function buildItemValidado(
  overrides: Partial<ItemValidadoResponse> = {},
): ItemValidadoResponse {
  return {
    codigo_producto: 'PROD-001',
    nombre: 'Motobomba 2"',
    precio_unitario: 100,
    cantidad: 1,
    subtotal: 100,
    ...overrides,
  };
}

/**
 * Respuesta de /cart/summary (total seguro). Por defecto arma un resumen
 * coherente de una sola linea; usar `overrides` para escenarios de multiples
 * lineas, advertencias o totales distintos.
 */
export function buildResumen(
  overrides: Partial<ResumenCarritoResponse> = {},
): ResumenCarritoResponse {
  return {
    items_validados: [
      {
        codigo_producto: 'PROD-001',
        nombre: 'Motobomba 2"',
        precio_unitario: 100,
        cantidad_procesada: 1,
        subtotal: 100,
        advertencia: null,
      },
    ],
    total_general: 100,
    ...overrides,
  };
}

/** Par de tokens emitido por /login o /refresh. */
export function buildTokenResponse(overrides: Partial<TokenResponse> = {}): TokenResponse {
  return {
    access_token: 'access-token-fake',
    refresh_token: 'refresh-token-fake',
    token_type: 'bearer',
    ...overrides,
  };
}

/** Identidad devuelta por /auth/me. */
export function buildUsuarioActual(overrides: Partial<UsuarioActual> = {}): UsuarioActual {
  return {
    id: 1,
    correo: 'cliente@ejemplo.com',
    rol: 'cliente',
    estado: 'verificada',
    ...overrides,
  };
}

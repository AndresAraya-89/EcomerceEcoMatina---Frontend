/**
 * Contratos del carrito.
 *
 * Estas interfaces replican exactamente los schemas Pydantic del backend
 * (modulo `cart`) para que el tipado del frontend y la API no se desincronicen.
 * Los montos viajan como `number` (el backend usa Decimal y los serializa a JSON).
 */

/** Item tal como lo guarda el frontend en sessionStorage (RF-16). */
export interface CartItem {
  codigo_producto: string;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
  subtotal: number;
}

// ── validate-item (RF-12) ──────────────────────────────────────────────────

/** Payload de POST /cart/validate-item. */
export interface ValidarItemRequest {
  codigo_producto: string;
  cantidad: number;
}

/** Respuesta segura de POST /cart/validate-item. */
export interface ItemValidadoResponse {
  codigo_producto: string;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
  subtotal: number;
}

// ── summary (RF-14) ────────────────────────────────────────────────────────

/** Linea enviada en POST /cart/summary. */
export interface ItemResumenRequest {
  codigo_producto: string;
  cantidad: number;
}

/** Payload de POST /cart/summary. */
export interface ResumenCarritoRequest {
  items: ItemResumenRequest[];
}

/** Linea recalculada que devuelve el backend; `advertencia` avisa cambios de stock/precio. */
export interface ItemResumenResponse {
  codigo_producto: string;
  nombre: string;
  precio_unitario: number;
  cantidad_procesada: number;
  subtotal: number;
  advertencia: string | null;
}

/** Respuesta de POST /cart/summary con el total seguro calculado por el backend. */
export interface ResumenCarritoResponse {
  items_validados: ItemResumenResponse[];
  total_general: number;
}

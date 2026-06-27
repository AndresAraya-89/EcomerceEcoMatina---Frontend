/**
 * Contratos del módulo `checkout` del backend (POST /checkout/).
 *
 * Espejo de los schemas Pydantic. El total viaja como Decimal (texto) y el
 * servicio lo convierte a `number`.
 */

/** Métodos de pago aceptados por el backend (patrón `^(sinpe|paypal)$`). */
export type MetodoPago = 'sinpe' | 'paypal';

/** Línea del pedido enviada en el checkout. */
export interface ItemCheckout {
  producto_codigo: string;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
}

/** Payload de POST /checkout/. */
export interface PedidoCreate {
  cliente_id: number;
  metodo_pago: MetodoPago;
  items: ItemCheckout[];
}

/** Payload de POST /checkout/paypal/capturar (token con que PayPal vuelve al return_url). */
export interface CapturaPaypalRequest {
  paypal_order_id: string;
}

/**
 * Acción que el frontend debe ejecutar tras crear el pedido, según el método:
 * - WHATSAPP_REDIRECT (SINPE): mostrar instrucciones para enviar el comprobante.
 * - PAYMENT_GATEWAY_REDIRECT (PayPal): redirigir a `url_pasarela` para aprobar.
 */
export type AccionPago = 'WHATSAPP_REDIRECT' | 'PAYMENT_GATEWAY_REDIRECT';

/** Instrucciones de pago que devuelve el backend (varían por método). */
export interface DetallesPago {
  accion?: AccionPago;
  instrucciones?: string;
  url_pasarela?: string;
  numero_orden_referencia?: string;
  [clave: string]: unknown;
}

/** Respuesta de POST /checkout/: pedido creado + instrucciones de pago. */
export interface PedidoOut {
  numero_orden: string;
  estado: string;
  total: number;
  mensaje: string;
  detalles_pago: DetallesPago;
}

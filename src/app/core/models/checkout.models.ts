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

/** Respuesta de POST /checkout/: pedido creado + instrucciones de pago. */
export interface PedidoOut {
  numero_orden: string;
  estado: string;
  total: number;
  mensaje: string;
  /** Instrucciones de pago según el método (p. ej. número SINPE o enlace PayPal). */
  detalles_pago: Record<string, unknown>;
}

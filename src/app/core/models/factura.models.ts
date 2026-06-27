/**
 * Contratos del modulo "Mis Facturas" (RF-42..45 del backend `mis_facturas`).
 *
 * Espejo de los schemas Pydantic. Endpoints protegidos: el "quien soy" sale del
 * JWT, asi que el cliente solo ve sus propias facturas (el token lo adjunta el
 * interceptor, no estos modelos).
 *
 * Los montos se exponen como `number`: el backend los serializa como texto
 * ("38250.00") y FacturaApiService los convierte (anti-corruption layer).
 * Las fechas viajan como ISO 8601 (string) para formatearlas con DatePipe.
 */

/** Fila del listado tabular (RF-43): lo minimo para identificar la compra. */
export interface FacturaListItem {
  numero_orden: string;
  fecha_emision: string;
  total: number;
  metodo_pago: string;
  estado: string;
  /** True si el PDF ya se puede descargar (RF-45). */
  pdf_disponible: boolean;
}

/** Listado paginado, cronologico descendente (RF-43). */
export interface FacturaListResponse {
  items: FacturaListItem[];
  pagina: number;
  por_pagina: number;
  total_registros: number;
  total_paginas: number;
}

/** Datos del cliente mostrados en el detalle (RF-44). */
export interface ClienteFactura {
  nombre_completo: string;
  tipo_identificacion: string;
  numero_identificacion: string;
  correo: string;
  telefono: string;
  direccion: string | null;
}

/** Linea de producto del detalle (RF-44) con su snapshot congelado. */
export interface DetalleProducto {
  producto_codigo: string;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

/** Detalle completo de una factura para el modal (RF-44). */
export interface FacturaDetalle {
  numero_orden: string;
  fecha_emision: string;
  metodo_pago: string;
  estado: string;
  total: number;
  pdf_disponible: boolean;
  cliente: ClienteFactura;
  productos: DetalleProducto[];
}

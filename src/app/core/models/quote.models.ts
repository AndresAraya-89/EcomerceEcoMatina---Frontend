/**
 * Contratos del modulo de cotizaciones (RF-30/31/32).
 *
 * Replican el formulario multipart de `POST /api/v1/quotes`. Es un endpoint
 * publico: el login es opcional (si hay token, el backend enlaza la cotizacion
 * al cliente; si no, queda anonima).
 */

/** Tipos de identificacion aceptados (ENUM del backend). */
export type TipoIdentificacion = 'cedula' | 'dimex' | 'pasaporte';

/** Datos del formulario de cotizacion que el componente entrega al servicio. */
export interface QuoteRequest {
  tipo_identificacion: TipoIdentificacion;
  numero_identificacion: string;
  nombre: string;
  correo: string;
  telefono: string;
  asunto: string;
  mensaje: string;
  archivos: File[];
}

/** Respuesta de POST /quotes. `notificado` indica si el aviso por WhatsApp salio bien. */
export interface QuoteResponse {
  id: number;
  mensaje: string;
  notificado: boolean;
  archivos: string[];
}

// ── Reglas de archivos (RF-31), espejo del backend ──────────────────────────

/** Tipos MIME permitidos para los adjuntos. */
export const TIPOS_ARCHIVO_PERMITIDOS = ['application/pdf', 'image/png', 'image/jpeg'] as const;

/** Maximo de archivos por solicitud. */
export const MAX_ARCHIVOS = 5;

/** Tamano maximo por archivo: 10 MB. */
export const MAX_TAMANO_BYTES = 10 * 1024 * 1024;

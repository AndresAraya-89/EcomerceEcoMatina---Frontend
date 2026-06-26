/**
 * Contratos del modulo de seguridad (`auth` del backend).
 *
 * Espejo exacto de los schemas Pydantic de `/api/v1/auth` para que el tipado del
 * frontend y la API no se desincronicen. Las reglas de validacion (clave, telefono)
 * se replican en los formularios; aqui solo viven los contratos de datos.
 */

/** Tipos de identificacion aceptados (ENUM de la BD: clientes.tipo_identificacion). */
export type TipoIdentificacion = 'cedula' | 'dimex' | 'pasaporte';

/** Estado de la cuenta (ENUM usuarios.estado). Nace 'no_verificada' tras el registro. */
export type EstadoCuenta = 'no_verificada' | 'verificada';

// ── Requests ────────────────────────────────────────────────────────────────

/** Payload de POST /auth/register (datos del cliente + credenciales). */
export interface RegisterRequest {
  nombre: string;
  primer_apellido: string;
  segundo_apellido: string | null;
  tipo_identificacion: TipoIdentificacion;
  numero_identificacion: string;
  telefono: string;
  correo: string;
  clave: string;
}

/** Payload de POST /auth/login. */
export interface LoginRequest {
  correo: string;
  clave: string;
}

/** Payload de POST /auth/refresh (el refresh token es opaco, no un JWT). */
export interface RefreshRequest {
  refresh_token: string;
}

/** Payload de POST /auth/verify-account y /auth/confirm-email-change. */
export interface TokenRequest {
  token: string;
}

/** Payload de POST /auth/forgot-password y /auth/resend-verification. */
export interface CorreoRequest {
  correo: string;
}

/** Payload de POST /auth/reset-password. */
export interface ResetearContrasenaRequest {
  token: string;
  clave_nueva: string;
}

/** Payload de POST /auth/change-password (requiere sesion). */
export interface CambiarContrasenaRequest {
  clave_actual: string;
  clave_nueva: string;
}

/** Payload de PUT /auth/profile (la identificacion NO es editable). */
export interface ActualizarPerfilRequest {
  nombre: string;
  primer_apellido: string;
  segundo_apellido: string | null;
  telefono: string;
  correo: string;
}

// ── Responses ─────────────────────────────────────────────────────────────

/** Par de tokens emitido por /login y /refresh (con rotacion del refresh). */
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

/** Respuesta generica con un mensaje (verify, logout, reset, etc.). */
export interface MensajeResponse {
  mensaje: string;
}

/** Respuesta de POST /auth/register. */
export interface RegisterResponse {
  mensaje: string;
  correo: string;
}

/** Identidad del usuario autenticado (GET /auth/me). `id` es el id de usuario. */
export interface UsuarioActual {
  id: number;
  /**
   * Id del cliente asociado (FK clientes.id, 1:1 con el usuario). Lo requiere el
   * checkout (POST /checkout/). El backend debe incluirlo en la respuesta de /me;
   * mientras no lo haga llegará `undefined` y el checkout lo manejará con un aviso.
   */
  cliente_id?: number;
  correo: string;
  rol: string;
  estado: EstadoCuenta;
}

/** Datos completos del perfil para "Mi Perfil" (GET /auth/profile, CU-19). */
export interface Perfil {
  nombre: string;
  primer_apellido: string;
  segundo_apellido: string | null;
  tipo_identificacion: string;
  numero_identificacion: string;
  correo: string;
  telefono: string;
}

/** Respuesta de PUT /auth/profile. */
export interface ActualizarPerfilResponse {
  mensaje: string;
  /** True si el correo cambio y queda pendiente de confirmacion por enlace. */
  correo_pendiente_confirmacion: boolean;
}

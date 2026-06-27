/**
 * Contratos del chatbot asistente virtual (CU-18).
 * Espejo de los schemas del modulo `chatbot` del backend.
 */

/** Rol de cada turno de la conversacion (igual que el backend). */
export type RolChat = 'user' | 'assistant';

/** Un mensaje de la conversacion. */
export interface MensajeChat {
  rol: RolChat;
  texto: string;
}

/** Payload de POST /chatbot/mensaje. */
export interface MensajeChatRequest {
  mensaje: string;
  historial: MensajeChat[];
}

/** Respuesta de POST /chatbot/mensaje. */
export interface MensajeChatResponse {
  respuesta: string;
}

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { MensajeChat, MensajeChatRequest, MensajeChatResponse } from '../models/chatbot.models';

/**
 * Acceso HTTP al chatbot (CU-18). Responsabilidad unica (SRP): hablar con
 * `/chatbot/mensaje`. El widget mantiene el estado de la conversacion; este
 * servicio solo arma la peticion.
 */
@Injectable({ providedIn: 'root' })
export class ChatbotApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/chatbot/mensaje`;

  /** Envia el mensaje (con el historial previo) y devuelve la respuesta del asistente. */
  enviar(mensaje: string, historial: MensajeChat[]): Observable<MensajeChatResponse> {
    const payload: MensajeChatRequest = { mensaje, historial };
    return this.http.post<MensajeChatResponse>(this.url, payload);
  }
}

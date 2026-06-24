import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { QuoteRequest, QuoteResponse } from '../models/quote.models';

/**
 * Acceso HTTP al modulo de cotizaciones del backend (RF-30).
 *
 * Responsabilidad unica (SRP): armar el multipart/form-data y enviarlo.
 * No valida (eso es del componente/formulario) ni guarda estado.
 */
@Injectable({ providedIn: 'root' })
export class QuoteApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/quotes`;

  /** Envia la solicitud de cotizacion con sus adjuntos opcionales. */
  enviar(data: QuoteRequest): Observable<QuoteResponse> {
    const form = new FormData();
    form.append('tipo_identificacion', data.tipo_identificacion);
    form.append('numero_identificacion', data.numero_identificacion);
    form.append('nombre', data.nombre);
    form.append('correo', data.correo);
    form.append('telefono', data.telefono);
    form.append('asunto', data.asunto?.trim() || 'Cotizacion');
    form.append('mensaje', data.mensaje);
    for (const archivo of data.archivos) {
      form.append('archivos', archivo, archivo.name);
    }
    // No fijamos Content-Type: el navegador agrega el boundary del multipart.
    return this.http.post<QuoteResponse>(this.url, form);
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CapturaPaypalRequest, PedidoCreate, PedidoOut } from '../models/checkout.models';

/**
 * Acceso HTTP al módulo `checkout` del backend.
 *
 * Responsabilidad única (SRP): hablar con `/checkout`. El backend serializa el
 * total como texto (Decimal); aquí se convierte a `number` (anti-corruption
 * layer). El Authorization lo agrega el interceptor.
 */
@Injectable({ providedIn: 'root' })
export class CheckoutApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/checkout`;

  /** POST /checkout/ — genera el pedido y devuelve las instrucciones de pago. */
  crearPedido(payload: PedidoCreate): Observable<PedidoOut> {
    return this.http
      .post<PedidoOut>(`${this.baseUrl}/`, payload)
      .pipe(map((p) => ({ ...p, total: Number(p.total) })));
  }

  /**
   * POST /checkout/paypal/capturar — captura (cobra) la orden aprobada en PayPal
   * y confirma el pedido. `paypalOrderId` es el token con que PayPal redirige al
   * return_url.
   */
  capturarPagoPaypal(paypalOrderId: string): Observable<PedidoOut> {
    const payload: CapturaPaypalRequest = { paypal_order_id: paypalOrderId };
    return this.http
      .post<PedidoOut>(`${this.baseUrl}/paypal/capturar`, payload)
      .pipe(map((p) => ({ ...p, total: Number(p.total) })));
  }

  /** URL del comprobante PDF de un pedido (GET /checkout/{numero_orden}/pdf). */
  urlPdf(numeroOrden: string): string {
    return `${this.baseUrl}/${encodeURIComponent(numeroOrden)}/pdf`;
  }
}

import { ChangeDetectionStrategy, Component, inject, resource } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';

import { CheckoutApiService } from '../../../core/services/checkout-api.service';

/**
 * Página de retorno de PayPal (destino de `PAYPAL_RETURN_URL`).
 *
 * Tras aprobar el pago, PayPal redirige aquí con `?token=<orderId>`. Esta página
 * toma ese token y dispara la CAPTURA del cobro (POST /checkout/paypal/capturar),
 * que confirma el pedido. Muestra los estados de carga / éxito / error.
 */
@Component({
  selector: 'app-paypal-return',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './paypal-return.html',
  styleUrl: './paypal-return.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaypalReturn {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(CheckoutApiService);

  /** Token de la orden de PayPal (lo agrega PayPal al redirigir al return_url). */
  readonly token = toSignal(
    this.route.queryParamMap.pipe(map((p) => p.get('token') ?? '')),
    { initialValue: '' },
  );

  /** Captura el pago en cuanto hay token. Expone isLoading / error / value. */
  readonly captura = resource({
    params: () => ({ token: this.token() }),
    loader: ({ params }) => {
      if (!params.token) {
        return Promise.resolve(null);
      }
      return firstValueFrom(this.api.capturarPagoPaypal(params.token));
    },
  });

  urlPdf(numeroOrden: string): string {
    return this.api.urlPdf(numeroOrden);
  }
}

import { ChangeDetectionStrategy, Component, effect, inject, resource } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';

import { CheckoutApiService } from '../../../core/services/checkout-api.service';
import { PaypalPopupService } from '../../../core/services/paypal-popup.service';

/**
 * Página de retorno de PayPal (destino de `PAYPAL_RETURN_URL`).
 *
 * Tras aprobar el pago, PayPal redirige aquí con `?token=<orderId>`. Esta página
 * toma ese token y dispara la CAPTURA del cobro (POST /checkout/paypal/capturar),
 * que confirma el pedido.
 *
 * Suele cargarse DENTRO de la ventana emergente que abrió el checkout: en ese
 * caso, al resolver la captura avisa el resultado a la pestaña original y se
 * cierra (no muestra UI). Si se abrió como página completa (popup bloqueado),
 * cae al render de carga / éxito / error de toda la vida.
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
  private readonly paypal = inject(PaypalPopupService);

  /** True si esta página corre dentro de la ventana emergente de PayPal. */
  readonly enPopup = this.paypal.enVentanaEmergente();

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

  constructor() {
    // Dentro del popup: en cuanto la captura resuelve, avisamos a la pestaña
    // original (que muestra la confirmación) y cerramos la ventana.
    effect(() => {
      if (!this.enPopup || this.captura.isLoading()) {
        return;
      }
      if (!this.token()) {
        this.paypal.notificarYCerrar('error');
      } else if (this.captura.error()) {
        this.paypal.notificarYCerrar('error');
      } else if (this.captura.hasValue()) {
        this.paypal.notificarYCerrar('completado');
      }
    });
  }

  urlPdf(numeroOrden: string): string {
    return this.api.urlPdf(numeroOrden);
  }
}

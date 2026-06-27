import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PaypalPopupService } from '../../../core/services/paypal-popup.service';

/**
 * Página de cancelación de PayPal (destino de `PAYPAL_CANCEL_URL`).
 *
 * PayPal redirige aquí cuando el comprador cancela el pago. El pedido quedó
 * creado pero sin confirmar; se invita a volver al carrito a reintentar.
 *
 * Si se carga dentro de la ventana emergente del checkout, avisa la cancelación
 * a la pestaña original y se cierra; si es página completa, muestra la vista.
 */
@Component({
  selector: 'app-paypal-cancel',
  imports: [RouterLink],
  templateUrl: './paypal-cancel.html',
  styleUrl: './paypal-cancel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaypalCancel {
  private readonly paypal = inject(PaypalPopupService);

  /** True si esta página corre dentro de la ventana emergente de PayPal. */
  readonly enPopup = this.paypal.enVentanaEmergente();

  constructor() {
    if (this.enPopup) {
      this.paypal.notificarYCerrar('cancelado');
    }
  }
}

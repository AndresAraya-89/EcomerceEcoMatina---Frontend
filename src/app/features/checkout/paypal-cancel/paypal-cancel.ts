import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Página de cancelación de PayPal (destino de `PAYPAL_CANCEL_URL`).
 *
 * PayPal redirige aquí cuando el comprador cancela el pago. El pedido quedó
 * creado pero sin confirmar; se invita a volver al carrito a reintentar.
 */
@Component({
  selector: 'app-paypal-cancel',
  imports: [RouterLink],
  templateUrl: './paypal-cancel.html',
  styleUrl: './paypal-cancel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaypalCancel {}

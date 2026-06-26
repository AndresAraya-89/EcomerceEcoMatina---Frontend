import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { CheckoutApiService } from '../../core/services/checkout-api.service';
import { MetodoPago, PedidoCreate, PedidoOut } from '../../core/models/checkout.models';

/**
 * Página de checkout (CU de compra): convierte el carrito en un pedido.
 *
 * Es una ruta protegida (authGuard): el checkout necesita el `cliente_id` del
 * usuario autenticado. Toma los ítems del CartService, deja elegir método de
 * pago (SINPE/PayPal) y delega el POST en CheckoutApiService (DIP). Al confirmar
 * muestra el número de orden, las instrucciones de pago y el comprobante PDF, y
 * vacía el carrito.
 */
@Component({
  selector: 'app-checkout',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Checkout {
  private readonly cart = inject(CartService);
  private readonly auth = inject(AuthService);
  private readonly api = inject(CheckoutApiService);

  readonly items = this.cart.items;
  readonly total = this.cart.totalGeneral;
  readonly cargandoTotal = this.cart.cargando;
  readonly vacio = this.cart.vacio;
  readonly usuario = this.auth.usuario;

  readonly metodos: { valor: MetodoPago; etiqueta: string; icono: string }[] = [
    { valor: 'sinpe', etiqueta: 'SINPE Móvil', icono: 'smartphone' },
    { valor: 'paypal', etiqueta: 'PayPal', icono: 'account_balance_wallet' },
  ];

  readonly metodoPago = signal<MetodoPago>('sinpe');
  readonly enviando = signal(false);
  readonly resultado = signal<PedidoOut | null>(null);
  readonly errorEnvio = signal<string | null>(null);

  /** Instrucciones de pago como pares clave/valor para listarlas en la vista. */
  readonly detallesPago = computed(() => {
    const r = this.resultado();
    return r ? Object.entries(r.detalles_pago) : [];
  });

  seleccionarMetodo(metodo: MetodoPago): void {
    this.metodoPago.set(metodo);
  }

  urlPdf(numeroOrden: string): string {
    return this.api.urlPdf(numeroOrden);
  }

  confirmar(): void {
    const clienteId = this.usuario()?.cliente_id;
    if (clienteId == null) {
      this.errorEnvio.set(
        'No pudimos obtener tu identificación de cliente. Recargá la página e intentá de nuevo.',
      );
      return;
    }
    if (this.cart.vacio()) {
      return;
    }

    this.enviando.set(true);
    this.errorEnvio.set(null);

    const payload: PedidoCreate = {
      cliente_id: clienteId,
      metodo_pago: this.metodoPago(),
      items: this.items().map((i) => ({
        producto_codigo: i.codigo_producto,
        producto_nombre: i.nombre,
        cantidad: i.cantidad,
        precio_unitario: i.precio_unitario,
      })),
    };

    this.api.crearPedido(payload).subscribe({
      next: (pedido) => {
        this.resultado.set(pedido);
        this.enviando.set(false);
        // Pedido creado: el carrito ya no aplica.
        this.cart.vaciar();
      },
      error: (err) => {
        this.errorEnvio.set(this.mensajeError(err));
        this.enviando.set(false);
      },
    });
  }

  private mensajeError(err: unknown): string {
    const detail = (err as { error?: { detail?: unknown } })?.error?.detail;
    if (typeof detail === 'string') {
      return detail;
    }
    return 'No se pudo procesar el pedido. Intentá de nuevo en unos minutos.';
  }
}

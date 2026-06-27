import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { CheckoutApiService } from '../../core/services/checkout-api.service';
import { PaypalPopupService } from '../../core/services/paypal-popup.service';
import { MetodoPago, PedidoCreate, PedidoOut } from '../../core/models/checkout.models';

/** Estado del pago con PayPal mientras se usa la ventana emergente. */
type EstadoPaypal = 'inactivo' | 'esperando' | 'completado' | 'cancelado' | 'error';

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
  private readonly paypal = inject(PaypalPopupService);

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

  /** Acción de pago indicada por el backend (redirección PayPal / instrucciones SINPE). */
  readonly accionPago = computed(() => this.resultado()?.detalles_pago.accion ?? null);
  /** URL de la pasarela (PayPal) a la que se debe redirigir para aprobar el pago. */
  readonly urlPasarela = computed(() => this.resultado()?.detalles_pago.url_pasarela ?? null);
  /** Instrucciones para completar el pago fuera de línea (SINPE). */
  readonly instruccionesPago = computed(() => this.resultado()?.detalles_pago.instrucciones ?? null);

  /** Estado del pago con PayPal a través de la ventana emergente. */
  readonly estadoPaypal = signal<EstadoPaypal>('inactivo');
  /** True si el navegador bloqueó la ventana emergente (mostrar enlace alterno). */
  readonly popupBloqueado = signal(false);

  seleccionarMetodo(metodo: MetodoPago): void {
    this.metodoPago.set(metodo);
  }

  /**
   * Abre la pasarela de PayPal en una ventana emergente y reacciona al resultado
   * sin abandonar esta pestaña (así no se reinicia la app ni se arriesga la sesión).
   * Si el navegador bloquea la ventana, deja el enlace directo como plan B.
   */
  pagarConPaypal(url: string): void {
    this.popupBloqueado.set(false);
    this.estadoPaypal.set('esperando');

    this.paypal.abrir(url).subscribe((resultado) => {
      switch (resultado) {
        case 'completado':
          this.estadoPaypal.set('completado');
          break;
        case 'cancelado':
          this.estadoPaypal.set('cancelado');
          break;
        case 'error':
          this.estadoPaypal.set('error');
          break;
        case 'bloqueado':
          this.estadoPaypal.set('inactivo');
          this.popupBloqueado.set(true);
          break;
      }
    });
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

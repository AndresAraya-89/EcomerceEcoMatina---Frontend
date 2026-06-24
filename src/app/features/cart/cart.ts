import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { CartService } from '../../core/services/cart.service';
import { CartItem } from '../../core/models/cart.models';

/**
 * Pagina del carrito (RF-14/15): lista los items, permite cambiar cantidades o
 * eliminarlos y muestra el total seguro validado por el backend.
 *
 * No contiene logica de negocio: todo se delega en CartService y la vista se
 * pinta a partir de sus signals.
 */
@Component({
  selector: 'app-cart',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cart {
  private readonly cart = inject(CartService);

  readonly items = this.cart.items;
  readonly total = this.cart.totalGeneral;
  readonly cargando = this.cart.cargando;
  readonly advertencias = this.cart.advertencias;
  readonly error = this.cart.error;
  readonly vacio = this.cart.vacio;

  cambiarCantidad(item: CartItem, cantidad: number): void {
    this.cart.actualizarCantidad(item.codigo_producto, cantidad);
  }

  eliminar(item: CartItem): void {
    this.cart.eliminar(item.codigo_producto);
  }

  vaciar(): void {
    this.cart.vaciar();
  }
}

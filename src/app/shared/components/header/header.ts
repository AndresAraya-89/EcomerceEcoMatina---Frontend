import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from "@angular/router";
import { toSignal } from '@angular/core/rxjs-interop';

import { CartService } from '../../../core/services/cart.service';
import { ProductApiService } from '../../../core/services/product-api.service';

@Component({
  selector: 'app-header',
  imports: [RouterLinkActive, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  private readonly cart = inject(CartService);
  private readonly productApi = inject(ProductApiService);

  /** Conteo de unidades para la burbuja del carrito (RF-13). */
  readonly totalItems = this.cart.totalItems;

  /** Categorias reales del backend para el menu (RF-04). */
  readonly categorias = toSignal(this.productApi.obtenerCategorias(), { initialValue: [] });

  /** Controla el desplegable "Productos". */
  readonly productosAbierto = signal(false);

  alternarProductos(): void {
    this.productosAbierto.update((abierto) => !abierto);
  }

  cerrarProductos(): void {
    this.productosAbierto.set(false);
  }
}

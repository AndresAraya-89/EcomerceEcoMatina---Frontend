import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { ProductoCard } from '../../../core/models/product.models';

/**
 * Tarjeta de producto reutilizable (presentacional / "dumb component").
 *
 * Recibe el producto por `input()` y avisa al padre con `output()` cuando se
 * pulsa "Agregar". No conoce el carrito ni la API (DIP): el contenedor decide
 * que hacer. Esto la hace reutilizable en grilla, busqueda y home (DRY/OCP).
 */
@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCard {
  /** Producto a mostrar. */
  readonly producto = input.required<ProductoCard>();

  /** Imagen por defecto cuando el producto no tiene foto. */
  readonly imagenFallback = input('/favicon.ico');

  /** Emite el codigo del producto al pulsar "Agregar al carrito". */
  readonly agregar = output<string>();

  onAgregar(): void {
    this.agregar.emit(this.producto().codigo);
  }
}

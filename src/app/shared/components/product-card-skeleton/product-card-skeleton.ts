import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Placeholder de carga de una tarjeta de producto (presentacional).
 *
 * Espejo visual de `ProductCard` para mostrar mientras llegan los datos.
 * Se usa en todas las grillas (búsqueda, ofertas, categoría) para un estado de
 * carga consistente (DRY). No recibe datos: es puramente decorativo.
 */
@Component({
  selector: 'app-product-card-skeleton',
  imports: [],
  templateUrl: './product-card-skeleton.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block', 'aria-hidden': 'true' },
})
export class ProductCardSkeleton {}

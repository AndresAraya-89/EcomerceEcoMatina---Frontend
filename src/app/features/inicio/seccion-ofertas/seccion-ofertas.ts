import { ChangeDetectionStrategy, Component, computed, inject, resource } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ProductApiService } from '../../../core/services/product-api.service';
import { CartService } from '../../../core/services/cart.service';
import { ProductoCard } from '../../../core/models/product.models';
import { ProductCard } from '../../../shared/components/product-card/product-card';
import { ProductCardSkeleton } from '../../../shared/components/product-card-skeleton/product-card-skeleton';

/**
 * Sección de productos en oferta del home (RF-01).
 *
 * Data-driven con `resource()` para tener estados de carga/valor explícitos.
 * Reutiliza el `ProductCard` del catálogo (DRY) y delega "Agregar" al
 * CartService (DIP). Las ofertas sí traen datos de descuento, así que la tarjeta
 * muestra el precio tachado y el porcentaje. Si no hay ofertas (o falla la
 * carga) la sección se oculta: es una franja promocional, no debe mostrar un
 * error ni un hueco vacío en la portada.
 */
@Component({
  selector: 'app-seccion-ofertas',
  imports: [ProductCard, ProductCardSkeleton],
  templateUrl: './seccion-ofertas.html',
  styleUrl: './seccion-ofertas.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeccionOfertas {
  private readonly api = inject(ProductApiService);
  private readonly cart = inject(CartService);

  /** Placeholders para el esqueleto de carga (no representan datos). */
  readonly esqueletos = Array.from({ length: 4 });

  private readonly ofertasResource = resource({
    loader: () => firstValueFrom(this.api.obtenerOfertas()),
  });

  readonly cargando = this.ofertasResource.isLoading;

  /** Adapta `ProductoOferta` al contrato de `ProductCard`. */
  readonly ofertas = computed<ProductoCard[]>(() =>
    (this.ofertasResource.value() ?? []).map((o) => ({
      codigo: o.codigo,
      nombre: o.nombre,
      precio_actual: o.precio_oferta,
      en_oferta: true,
      precio_original: o.precio_original,
      porcentaje_descuento: o.porcentaje_descuento,
      imagen_url: o.imagen_url,
    })),
  );

  agregar(codigoProducto: string): void {
    this.cart.agregar(codigoProducto, 1);
  }
}

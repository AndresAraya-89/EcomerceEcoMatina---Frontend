import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { ProductApiService } from '../../../core/services/product-api.service';
import { CartService } from '../../../core/services/cart.service';
import { ProductoCard } from '../../../core/models/product.models';
import { ProductCard } from '../../../shared/components/product-card/product-card';

/**
 * Productos destacados del home: lo mas vendido (RF-02).
 *
 * Data-driven: trae los productos reales de la API y los pinta con el mismo
 * `ProductCard` reutilizable del catalogo (DRY). El boton "Agregar" se delega al
 * CartService (DIP), igual que en la grilla de categoria, de modo que aqui
 * tambien funciona y muestra el toast. Antes eran tarjetas hardcodeadas con
 * botones muertos.
 */
@Component({
  selector: 'app-seccion-categorias-tecnicas',
  imports: [ProductCard],
  templateUrl: './seccion-categorias-tecnicas.html',
  styleUrl: './seccion-categorias-tecnicas.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeccionCategoriasTecnicas {
  private readonly api = inject(ProductApiService);
  private readonly cart = inject(CartService);

  private readonly masVendidos = toSignal(this.api.obtenerMasVendidos(), {
    initialValue: [],
  });

  /**
   * Adapta `ProductoMasVendido` al contrato de `ProductCard`. Los mas vendidos
   * no traen datos de oferta, asi que se rellenan en neutro.
   */
  readonly destacados = computed<ProductoCard[]>(() =>
    this.masVendidos().map((p) => ({
      codigo: p.codigo,
      nombre: p.nombre,
      precio_actual: p.precio_actual,
      en_oferta: false,
      precio_original: null,
      porcentaje_descuento: null,
      imagen_url: p.imagen_url,
    })),
  );

  agregar(codigoProducto: string): void {
    this.cart.agregar(codigoProducto, 1);
  }
}

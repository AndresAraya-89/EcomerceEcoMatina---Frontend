import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  resource,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';

import { ProductApiService } from '../../core/services/product-api.service';
import { CartService } from '../../core/services/cart.service';
import { Categoria as CategoriaModel } from '../../core/models/product.models';
import { ProductCard } from '../../shared/components/product-card/product-card';
import { ProductCardSkeleton } from '../../shared/components/product-card-skeleton/product-card-skeleton';
import { CategoryFilter } from '../../shared/components/category-filter/category-filter';

/**
 * Pagina de resultados de busqueda (RF-08/09/10).
 *
 * Data-driven y deep-linkeable: la URL (`/buscar?q=...&categoria=...&page=...`)
 * es la unica fuente de verdad. Cambiar el termino, el filtro de categoria o la
 * pagina se hace navegando (router.navigate), de modo que el resultado es
 * compartible y el boton "atras" del navegador funciona. Reutiliza el mismo
 * `ProductCard` y `CategoryFilter` del catalogo (DRY) y delega "Agregar" al
 * CartService (DIP).
 */
@Component({
  selector: 'app-buscar',
  imports: [ProductCard, ProductCardSkeleton, CategoryFilter],
  templateUrl: './buscar.html',
  styleUrl: './buscar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Buscar {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ProductApiService);
  private readonly cart = inject(CartService);

  /** Termino de busqueda tomado de la query string. */
  readonly consulta = toSignal(
    this.route.queryParamMap.pipe(map((p) => p.get('q')?.trim() ?? '')),
    { initialValue: '' },
  );

  /** Codigo de categoria para filtrar (opcional). Vacio = todas. */
  readonly categoriaFiltro = toSignal(
    this.route.queryParamMap.pipe(map((p) => p.get('categoria') ?? '')),
    { initialValue: '' },
  );

  /** Pagina actual (RF-11). */
  readonly pagina = toSignal(
    this.route.queryParamMap.pipe(map((p) => Math.max(1, Number(p.get('page')) || 1))),
    { initialValue: 1 },
  );

  /** Categorias para el filtro lateral (RF-04). */
  readonly categorias = toSignal(this.api.obtenerCategorias(), {
    initialValue: [] as CategoriaModel[],
  });

  /** Placeholders para el esqueleto de carga (no representan datos). */
  readonly esqueletos = Array.from({ length: 6 });

  /** Carga reactiva: se repite cuando cambia el termino, el filtro o la pagina. */
  readonly resultado = resource({
    params: () => ({
      q: this.consulta(),
      categoria: this.categoriaFiltro(),
      pagina: this.pagina(),
    }),
    loader: ({ params }) => {
      if (!params.q) {
        return Promise.resolve(null);
      }
      return firstValueFrom(
        this.api.buscar(params.q, params.categoria || null, params.pagina),
      );
    },
  });

  readonly hayPaginaPrevia = computed(() => this.pagina() > 1);
  readonly hayPaginaSiguiente = computed(() => {
    const data = this.resultado.value();
    return data ? this.pagina() < data.total_paginas : false;
  });

  agregar(codigoProducto: string): void {
    this.cart.agregar(codigoProducto, 1);
  }

  /** Filtra por categoria conservando el termino y reiniciando la paginacion. */
  seleccionarCategoria(codigoCategoria: string): void {
    // Volver a tocar la categoria activa la quita (toggle): vuelve a "todas".
    const categoria = codigoCategoria === this.categoriaFiltro() ? null : codigoCategoria;
    this.navegar({ categoria, page: 1 });
  }

  quitarFiltro(): void {
    this.navegar({ categoria: null, page: 1 });
  }

  paginaPrevia(): void {
    if (this.hayPaginaPrevia()) {
      this.navegar({ page: this.pagina() - 1 });
    }
  }

  paginaSiguiente(): void {
    if (this.hayPaginaSiguiente()) {
      this.navegar({ page: this.pagina() + 1 });
    }
  }

  /** Actualiza la URL fusionando parametros; la recarga la dispara `resource`. */
  private navegar(params: Record<string, string | number | null>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
    });
  }
}

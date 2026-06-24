import { ChangeDetectionStrategy, Component, computed, inject, resource, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';

import { ProductApiService } from '../../core/services/product-api.service';
import { CartService } from '../../core/services/cart.service';
import { ProductCard } from '../../shared/components/product-card/product-card';

/**
 * Pagina generica de productos por categoria (RF-05).
 *
 * Data-driven: lee el codigo de la ruta (`/categoria/:codigo`) y carga la grilla
 * desde la API. Una sola pagina sirve para TODAS las categorias (OCP: agregar
 * categorias no requiere nuevos componentes). El boton "Agregar" del ProductCard
 * se delega al CartService (DIP).
 */
@Component({
  selector: 'app-categoria',
  imports: [ProductCard],
  templateUrl: './categoria.html',
  styleUrl: './categoria.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Categoria {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ProductApiService);
  private readonly cart = inject(CartService);

  /** Codigo de categoria tomado de la URL. */
  readonly codigo = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('codigo') ?? '')),
    { initialValue: '' },
  );

  /** Pagina actual de la grilla (RF-11). */
  readonly pagina = signal(1);

  /** Carga reactiva: se vuelve a pedir cuando cambia el codigo o la pagina. */
  readonly grilla = resource({
    params: () => ({ codigo: this.codigo(), pagina: this.pagina() }),
    loader: ({ params }) => {
      if (!params.codigo) {
        return Promise.resolve(null);
      }
      return firstValueFrom(this.api.productosPorCategoria(params.codigo, params.pagina));
    },
  });

  readonly hayPaginaPrevia = computed(() => this.pagina() > 1);
  readonly hayPaginaSiguiente = computed(() => {
    const data = this.grilla.value();
    return data ? this.pagina() < data.total_paginas : false;
  });

  agregar(codigoProducto: string): void {
    this.cart.agregar(codigoProducto, 1);
  }

  paginaPrevia(): void {
    if (this.hayPaginaPrevia()) {
      this.pagina.update((p) => p - 1);
    }
  }

  paginaSiguiente(): void {
    if (this.hayPaginaSiguiente()) {
      this.pagina.update((p) => p + 1);
    }
  }
}

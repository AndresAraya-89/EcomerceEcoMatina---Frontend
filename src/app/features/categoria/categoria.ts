import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  resource,
  signal,
  untracked,
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
 * Pagina generica de productos por categoria (RF-05).
 *
 * Data-driven: lee el codigo de la ruta (`/categoria/:codigo`) y carga la grilla
 * desde la API. Una sola pagina sirve para TODAS las categorias (OCP: agregar
 * categorias no requiere nuevos componentes). El boton "Agregar" del ProductCard
 * se delega al CartService (DIP).
 */
@Component({
  selector: 'app-categoria',
  imports: [ProductCard, ProductCardSkeleton, CategoryFilter],
  templateUrl: './categoria.html',
  styleUrl: './categoria.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Categoria {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ProductApiService);
  private readonly cart = inject(CartService);

  /** Codigo de categoria tomado de la URL. */
  readonly codigo = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('codigo') ?? '')),
    { initialValue: '' },
  );

  /** Categorias para el filtro lateral (RF-04). Independientes de la grilla. */
  readonly categorias = toSignal(this.api.obtenerCategorias(), {
    initialValue: [] as CategoriaModel[],
  });

  /** Pagina actual de la grilla (RF-11). */
  readonly pagina = signal(1);

  /** Placeholders para el esqueleto de carga (no representan datos). */
  readonly esqueletos = Array.from({ length: 6 });

  constructor() {
    // La URL es la fuente de verdad de la categoria; al cambiar de categoria
    // (filtro o menu) la paginacion vuelve al inicio para no pedir una pagina
    // inexistente de la nueva grilla.
    effect(() => {
      this.codigo();
      untracked(() => {
        if (this.pagina() !== 1) {
          this.pagina.set(1);
        }
      });
    });
  }

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

  /** Cambia de categoria navegando: mantiene la URL deep-linkeable y recarga la grilla. */
  seleccionarCategoria(codigoCategoria: string): void {
    this.router.navigate(['/categoria', codigoCategoria]);
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

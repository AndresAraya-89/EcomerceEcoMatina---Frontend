import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  resource,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';

import { ProductApiService } from '../../core/services/product-api.service';
import { CartService } from '../../core/services/cart.service';

/**
 * Pagina de detalle de producto (RF-07).
 *
 * Lee el codigo de la ruta (`/producto/:codigo`), carga el detalle desde la API
 * y permite elegir cantidad y agregar al carrito. La imagen mostrada se mantiene
 * en un signal que se reinicia al cambiar de producto (linkedSignal).
 */
@Component({
  selector: 'app-producto',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './producto.html',
  styleUrl: './producto.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Producto {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ProductApiService);
  private readonly cart = inject(CartService);

  /** Imagen por defecto si el producto no tiene fotos. */
  readonly imagenFallback = '/favicon.ico';

  /** Codigo del producto tomado de la URL. */
  readonly codigo = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('codigo') ?? '')),
    { initialValue: '' },
  );

  /** Carga reactiva del detalle; se repite si cambia el codigo. */
  readonly detalle = resource({
    params: () => ({ codigo: this.codigo() }),
    loader: ({ params }) => {
      if (!params.codigo) {
        return Promise.resolve(null);
      }
      return firstValueFrom(this.api.obtenerDetalle(params.codigo));
    },
  });

  /** Imagen actualmente seleccionada; se reinicia a la principal al cambiar de producto. */
  readonly imagenSeleccionada = linkedSignal(() => {
    const d = this.detalle.value();
    if (!d || d.imagenes.length === 0) {
      return this.imagenFallback;
    }
    return d.imagenes.find((img) => img.es_principal)?.url ?? d.imagenes[0].url;
  });

  /** Cantidad a agregar al carrito. */
  readonly cantidad = signal(1);

  /** Mensaje de confirmacion tras agregar. */
  readonly agregadoOk = signal(false);

  readonly enOferta = computed(() => this.detalle.value()?.en_oferta ?? false);

  seleccionarImagen(url: string): void {
    this.imagenSeleccionada.set(url);
  }

  cambiarCantidad(delta: number): void {
    this.cantidad.update((c) => Math.max(1, c + delta));
  }

  agregar(): void {
    const d = this.detalle.value();
    if (!d) {
      return;
    }
    this.cart.agregar(d.codigo, this.cantidad());
    this.agregadoOk.set(true);
    setTimeout(() => this.agregadoOk.set(false), 2500);
  }
}

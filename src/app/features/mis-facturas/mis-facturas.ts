import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  resource,
  signal,
} from '@angular/core';
import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { FacturaApiService } from '../../core/services/factura-api.service';
import { FacturaDetalleModal } from './factura-detalle/factura-detalle';

/**
 * Pagina "Mis Facturas" (RF-42..45). Ruta protegida por authGuard.
 *
 * Contenedor inteligente ("smart component"): orquesta el estado (paginacion,
 * factura seleccionada, descarga) y delega:
 *   - el transporte HTTP en FacturaApiService (SRP / DIP)
 *   - la presentacion del detalle en FacturaDetalleModal (Container/Presentational)
 *
 * La carga es reactiva (patron resource): la lista se recarga cuando cambia la
 * pagina y el detalle cuando cambia la orden seleccionada, sin suscripciones
 * manuales ni fugas.
 */
@Component({
  selector: 'app-mis-facturas',
  imports: [CurrencyPipe, DatePipe, TitleCasePipe, FacturaDetalleModal],
  templateUrl: './mis-facturas.html',
  styleUrl: './mis-facturas.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MisFacturas {
  private readonly api = inject(FacturaApiService);

  private static readonly POR_PAGINA = 20;

  // ── Paginacion (RF-43) ─────────────────────────────────────────────────────
  readonly pagina = signal(1);

  /** Listado paginado; se recarga solo al cambiar la pagina. */
  readonly listado = resource({
    params: () => ({ pagina: this.pagina() }),
    loader: ({ params }) =>
      firstValueFrom(this.api.listar(params.pagina, MisFacturas.POR_PAGINA)),
  });

  readonly facturas = computed(() => this.listado.value()?.items ?? []);
  readonly totalPaginas = computed(() => this.listado.value()?.total_paginas ?? 0);
  readonly hayPaginaPrevia = computed(() => this.pagina() > 1);
  readonly hayPaginaSiguiente = computed(() => this.pagina() < this.totalPaginas());

  // ── Detalle (RF-44) ─────────────────────────────────────────────────────────
  /** Orden cuyo detalle se muestra en el modal; null = modal cerrado. */
  readonly ordenSeleccionada = signal<string | null>(null);
  readonly errorModal = signal<string | null>(null);

  /** Detalle de la orden seleccionada; se resuelve al abrir el modal. */
  readonly detalle = resource({
    params: () => ({ orden: this.ordenSeleccionada() }),
    loader: ({ params }) =>
      params.orden
        ? firstValueFrom(this.api.obtenerDetalle(params.orden))
        : Promise.resolve(null),
  });

  // ── Descarga del PDF (RF-45) ────────────────────────────────────────────────
  readonly descargando = signal(false);

  // ── Acciones ────────────────────────────────────────────────────────────────

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

  abrirDetalle(numeroOrden: string): void {
    this.errorModal.set(null);
    this.ordenSeleccionada.set(numeroOrden);
  }

  cerrarDetalle(): void {
    this.ordenSeleccionada.set(null);
    this.errorModal.set(null);
  }

  /** Descarga el PDF como blob y lo guarda con el numero de orden como nombre. */
  descargarPdf(numeroOrden: string): void {
    this.descargando.set(true);
    this.errorModal.set(null);
    this.api.descargarPdf(numeroOrden).subscribe({
      next: (blob) => {
        this.guardarBlob(blob, `factura-${numeroOrden}.pdf`);
        this.descargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.errorModal.set(
          err.status === 409
            ? 'La factura aún no está disponible para descargar.'
            : 'No se pudo descargar el PDF. Intenta de nuevo.',
        );
        this.descargando.set(false);
      },
    });
  }

  /** Dispara la descarga del blob en el navegador (object URL temporal). */
  private guardarBlob(blob: Blob, nombre: string): void {
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    enlace.click();
    URL.revokeObjectURL(url);
  }
}

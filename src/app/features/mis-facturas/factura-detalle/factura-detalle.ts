import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';

import { FacturaDetalle } from '../../../core/models/factura.models';

/**
 * Modal de detalle de factura (RF-44) — componente presentacional ("dumb").
 *
 * Solo muestra lo que recibe por `input()` y avisa al contenedor por `output()`
 * (cerrar / descargar). No sabe de API, routing ni token (DIP): el contenedor
 * MisFacturas decide como cargar el detalle y como bajar el PDF. Asi es testeable
 * en aislamiento y reutilizable (SRP/OCP).
 */
@Component({
  selector: 'app-factura-detalle',
  imports: [CurrencyPipe, DatePipe, TitleCasePipe],
  templateUrl: './factura-detalle.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FacturaDetalleModal {
  /** Detalle a mostrar; null mientras carga. */
  readonly detalle = input<FacturaDetalle | null>(null);

  /** True mientras se resuelve el detalle desde la API. */
  readonly cargando = input(false);

  /** True mientras se descarga el PDF (deshabilita el boton). */
  readonly descargando = input(false);

  /** Mensaje de error a mostrar dentro del modal (carga o descarga). */
  readonly error = input<string | null>(null);

  /** Pide cerrar el modal. */
  readonly cerrar = output<void>();

  /** Pide descargar el PDF de la factura. */
  readonly descargar = output<void>();
}

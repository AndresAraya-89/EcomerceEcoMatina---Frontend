import { Injectable, computed, effect, inject, signal } from '@angular/core';

import { CartItem } from '../models/cart.models';
import { CartApiService } from './cart-api.service';
import { CartStorageService } from './cart-storage.service';
import { NotificationService } from './notification.service';

/**
 * Estado y reglas del carrito (patron Facade + store con signals).
 *
 * Es la unica puerta de entrada para los componentes (header, pagina de carrito,
 * tarjetas de producto). Mantiene el estado reactivo, lo persiste y delega:
 *   - el transporte HTTP en CartApiService (RF-12 / RF-14)
 *   - la persistencia en CartStorageService (RF-16)
 *
 * El backend es la fuente de verdad de precios y totales: tras cada cambio se
 * pide /summary y se reconcilia el carrito local con lo que valida el servidor.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly api = inject(CartApiService);
  private readonly storage = inject(CartStorageService);
  private readonly notificaciones = inject(NotificationService);

  // ── Estado privado escribible ──────────────────────────────────────────
  private readonly _items = signal<CartItem[]>(this.storage.cargar());
  private readonly _totalGeneral = signal(0);
  private readonly _cargando = signal(false);
  private readonly _advertencias = signal<string[]>([]);
  private readonly _error = signal<string | null>(null);

  // ── Estado publico de solo lectura ─────────────────────────────────────
  /** Items del carrito (RF-15). */
  readonly items = this._items.asReadonly();
  /** Total seguro calculado por el backend (RF-14). */
  readonly totalGeneral = this._totalGeneral.asReadonly();
  /** True mientras se consulta /summary. */
  readonly cargando = this._cargando.asReadonly();
  /** Avisos del backend (stock o precio que cambio). */
  readonly advertencias = this._advertencias.asReadonly();
  /** Mensaje de error de la ultima operacion, si la hubo. */
  readonly error = this._error.asReadonly();

  // ── Estado derivado ────────────────────────────────────────────────────
  /** Conteo total de unidades para la burbuja del header (RF-13). */
  readonly totalItems = computed(() =>
    this._items().reduce((total, item) => total + item.cantidad, 0),
  );
  /** True si el carrito no tiene items. */
  readonly vacio = computed(() => this._items().length === 0);

  constructor() {
    // Persiste automaticamente cada vez que cambia el carrito (RF-16).
    effect(() => this.storage.guardar(this._items()));

    // Recalcula el total con el backend si habia items guardados al iniciar.
    if (this._items().length > 0) {
      this.refrescarResumen();
    }
  }

  /**
   * RF-12/15: agrega un producto. Primero valida contra el backend (stock,
   * precio real); si pasa, lo mezcla en el carrito (suma cantidades si ya existe)
   * y refresca el total seguro.
   */
  agregar(codigoProducto: string, cantidad = 1): void {
    this._error.set(null);
    this.api.validarItem({ codigo_producto: codigoProducto, cantidad }).subscribe({
      next: (validado) => {
        this._items.update((items) => {
          const idx = items.findIndex((i) => i.codigo_producto === validado.codigo_producto);
          if (idx === -1) {
            return [
              ...items,
              {
                codigo_producto: validado.codigo_producto,
                nombre: validado.nombre,
                precio_unitario: validado.precio_unitario,
                cantidad: validado.cantidad,
                subtotal: validado.subtotal,
              },
            ];
          }
          const copia = [...items];
          const nuevaCantidad = copia[idx].cantidad + validado.cantidad;
          copia[idx] = {
            ...copia[idx],
            precio_unitario: validado.precio_unitario,
            cantidad: nuevaCantidad,
            subtotal: validado.precio_unitario * nuevaCantidad,
          };
          return copia;
        });
        this.notificaciones.exito(`"${validado.nombre}" se agregó al carrito`);
        this.refrescarResumen();
      },
      error: (err) => {
        const mensaje = this.mensajeError(err);
        this._error.set(mensaje);
        this.notificaciones.error(mensaje);
      },
    });
  }

  /** RF-15: cambia la cantidad de una linea (0 o menos la elimina). */
  actualizarCantidad(codigoProducto: string, cantidad: number): void {
    if (cantidad <= 0) {
      this.eliminar(codigoProducto);
      return;
    }
    this._items.update((items) =>
      items.map((item) =>
        item.codigo_producto === codigoProducto
          ? { ...item, cantidad, subtotal: item.precio_unitario * cantidad }
          : item,
      ),
    );
    this.refrescarResumen();
  }

  /** RF-15: quita una linea del carrito. */
  eliminar(codigoProducto: string): void {
    this._items.update((items) => items.filter((i) => i.codigo_producto !== codigoProducto));
    this.refrescarResumen();
  }

  /** Vacia por completo el carrito. */
  vaciar(): void {
    this._items.set([]);
    this._totalGeneral.set(0);
    this._advertencias.set([]);
    this.storage.limpiar();
  }

  /**
   * RF-14: pide al backend el resumen seguro y reconcilia el carrito local
   * (ajusta cantidades/subtotales y junta las advertencias de stock/precio).
   */
  private refrescarResumen(): void {
    const items = this._items();
    if (items.length === 0) {
      this._totalGeneral.set(0);
      this._advertencias.set([]);
      return;
    }

    this._cargando.set(true);
    this.api
      .obtenerResumen({
        items: items.map((i) => ({ codigo_producto: i.codigo_producto, cantidad: i.cantidad })),
      })
      .subscribe({
        next: (resumen) => {
          // Reconciliar: el backend manda; ajustamos cantidades y precios.
          this._items.set(
            resumen.items_validados.map((linea) => ({
              codigo_producto: linea.codigo_producto,
              nombre: linea.nombre,
              precio_unitario: linea.precio_unitario,
              cantidad: linea.cantidad_procesada,
              subtotal: linea.subtotal,
            })),
          );
          this._totalGeneral.set(resumen.total_general);
          this._advertencias.set(
            resumen.items_validados
              .map((l) => l.advertencia)
              .filter((a): a is string => a !== null),
          );
          this._cargando.set(false);
        },
        error: (err) => {
          this._error.set(this.mensajeError(err));
          this._cargando.set(false);
        },
      });
  }

  /** Extrae un mensaje legible del error HTTP (el backend manda `detail`). */
  private mensajeError(err: unknown): string {
    const detail = (err as { error?: { detail?: string } })?.error?.detail;
    return detail ?? 'No se pudo contactar al servidor. Intenta de nuevo.';
  }
}

import { Injectable, signal } from '@angular/core';

/** Tipos de aviso que entiende la UI (define el color/icono del toast). */
export type TipoNotificacion = 'exito' | 'error' | 'info';

/** Aviso transitorio mostrado al usuario. */
export interface Notificacion {
  readonly id: number;
  readonly tipo: TipoNotificacion;
  readonly mensaje: string;
}

/**
 * Servicio de mensajeria al usuario (puerto de feedback de la aplicacion).
 *
 * Responsabilidad unica (SRP): mantener la cola de avisos y su ciclo de vida
 * (alta + auto-descarte). No conoce el DOM: solo expone estado reactivo. El
 * render lo hace `Toast` (componente presentacional), de modo que la logica
 * que dispara avisos (carrito, formularios, etc.) depende de esta abstraccion
 * y no de la vista (DIP). Cualquier feature puede inyectarlo para dar feedback
 * sin acoplarse a como se ve un toast.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  /** Tiempo que un aviso permanece visible antes de auto-descartarse. */
  private readonly duracionMs = 3500;

  private contador = 0;
  private readonly _items = signal<Notificacion[]>([]);

  /** Avisos activos (solo lectura para la vista). */
  readonly items = this._items.asReadonly();

  exito(mensaje: string): void {
    this.mostrar('exito', mensaje);
  }

  error(mensaje: string): void {
    this.mostrar('error', mensaje);
  }

  info(mensaje: string): void {
    this.mostrar('info', mensaje);
  }

  /** Quita un aviso (lo invoca el auto-descarte o el clic del usuario). */
  descartar(id: number): void {
    this._items.update((items) => items.filter((n) => n.id !== id));
  }

  private mostrar(tipo: TipoNotificacion, mensaje: string): void {
    const id = ++this.contador;
    this._items.update((items) => [...items, { id, tipo, mensaje }]);
    setTimeout(() => this.descartar(id), this.duracionMs);
  }
}

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { NotificationService } from '../../../core/services/notification.service';

/**
 * Pila de avisos (componente presentacional / "dumb").
 *
 * Solo lee la cola del `NotificationService` y la pinta; el descarte por clic se
 * delega al mismo servicio. No tiene logica de negocio. Se monta una sola vez en
 * la raiz (`app.html`) y sirve a toda la app (DRY): cualquier feature que inyecte
 * el servicio reutiliza esta vista sin conocerla.
 */
@Component({
  selector: 'app-toast',
  imports: [],
  templateUrl: './toast.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Toast {
  private readonly notificaciones = inject(NotificationService);

  readonly items = this.notificaciones.items;

  /** Icono de Material Symbols segun el tipo de aviso. */
  icono(tipo: string): string {
    switch (tipo) {
      case 'exito':
        return 'check_circle';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  }

  descartar(id: number): void {
    this.notificaciones.descartar(id);
  }
}

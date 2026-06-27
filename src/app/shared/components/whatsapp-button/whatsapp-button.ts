import { ChangeDetectionStrategy, Component } from '@angular/core';

import { environment } from '../../../../environments/environment';

/**
 * Boton flotante de WhatsApp (esquina inferior derecha, fijo).
 *
 * Abre el chat contra el numero de Agromatina configurado en el environment
 * (mismo numero que recibe las cotizaciones). Es puro frontend: no llama a la API.
 */
@Component({
  selector: 'app-whatsapp-button',
  imports: [],
  templateUrl: './whatsapp-button.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WhatsappButton {
  /** Enlace wa.me con un mensaje inicial ya escrito. */
  readonly whatsappUrl =
    `https://wa.me/${environment.whatsapp}` +
    `?text=${encodeURIComponent('Hola, me gustaría obtener más información sobre sus productos.')}`;
}

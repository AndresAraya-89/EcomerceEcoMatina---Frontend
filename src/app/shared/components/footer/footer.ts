import { ChangeDetectionStrategy, Component } from '@angular/core';

import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
  /** Año actual para el aviso de copyright (evita dejar un año fijo obsoleto). */
  readonly anio = new Date().getFullYear();

  /**
   * Enlace de "Contacto" hacia WhatsApp (wa.me) con un mensaje inicial. Abre el
   * chat contra el numero de Agromatina configurado en el environment.
   */
  readonly whatsappUrl =
    `https://wa.me/${environment.whatsapp}` +
    `?text=${encodeURIComponent('Hola, me gustaría obtener más información sobre sus productos.')}`;

  /** Ubicacion de Agromatina (Matina, Limón) para abrir indicaciones en Waze. */
  readonly wazeUrl =
    'https://www.waze.com/es/live-map/directions/cr/limon/matina/agromatina' +
    '?to=place.ChIJERswcWc9p48R6wo7K0prTSI';
}

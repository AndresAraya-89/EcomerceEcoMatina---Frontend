import { ChangeDetectionStrategy, Component } from '@angular/core';

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
}

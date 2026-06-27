import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { ProductApiService } from '../../../core/services/product-api.service';
import { Categoria } from '../../../core/models/product.models';

/**
 * Acceso rapido a categorias en el home (RF-04).
 *
 * Data-driven: trae las categorias reales de la API y cada tile navega al
 * catalogo `/categoria/:codigo` (la pagina que ya filtra y pagina). Antes eran
 * enlaces muertos (`href="#"`); ahora son el punto de entrada al catalogo. El
 * icono es decorativo y se mapea por codigo con un fallback generico.
 */
@Component({
  selector: 'app-seccion-categoria-rapidas',
  imports: [RouterLink],
  templateUrl: './seccion-categoria-rapidas.html',
  styleUrl: './seccion-categoria-rapidas.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeccionCategoriaRapidas {
  private readonly api = inject(ProductApiService);

  readonly categorias = toSignal(this.api.obtenerCategorias(), {
    initialValue: [] as Categoria[],
  });

  /** Icono Material Symbols por codigo de categoria (solo decorativo). */
  private readonly iconos: Record<string, string> = {
    'CAT-CON': 'foundation',
    'CAT-ELE': 'bolt',
    'CAT-FER': 'hardware',
    'CAT-FON': 'plumbing',
    'CAT-HER': 'construction',
    'CAT-JAR': 'yard',
    'CAT-PIN': 'format_paint',
    'CAT-SEG': 'health_and_safety',
  };

  icono(codigo: string): string {
    return this.iconos[codigo] ?? 'category';
  }
}

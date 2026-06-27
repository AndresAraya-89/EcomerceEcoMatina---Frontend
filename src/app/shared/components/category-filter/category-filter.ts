import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { Categoria } from '../../../core/models/product.models';

/**
 * Filtro de categorias reutilizable (presentacional / "dumb component").
 *
 * Recibe la lista de categorias y cual esta activa por `input()`, y avisa al
 * padre con `output()` cuando el usuario elige una. No sabe de routing, API ni
 * catalogo (DIP): el contenedor decide que hacer con la seleccion (navegar,
 * recargar, etc.). Asi puede reutilizarse en el catalogo, en buscador o en una
 * landing sin cambios (OCP/DRY).
 *
 * Responsive: en movil se ve como chips horizontales; en escritorio como una
 * barra lateral vertical.
 */
@Component({
  selector: 'app-category-filter',
  imports: [],
  templateUrl: './category-filter.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class CategoryFilter {
  /** Categorias a listar. */
  readonly categorias = input.required<Categoria[]>();

  /** Codigo de la categoria actualmente seleccionada (para resaltarla). */
  readonly activa = input<string>('');

  /** Emite el codigo de la categoria elegida. */
  readonly seleccionar = output<string>();

  onSeleccionar(codigo: string): void {
    if (codigo !== this.activa()) {
      this.seleccionar.emit(codigo);
    }
  }
}

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from "@angular/router";
import { toSignal } from '@angular/core/rxjs-interop';

import { CartService } from '../../../core/services/cart.service';
import { ProductApiService } from '../../../core/services/product-api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterLinkActive, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  private readonly cart = inject(CartService);
  private readonly productApi = inject(ProductApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Conteo de unidades para la burbuja del carrito (RF-13). */
  readonly totalItems = this.cart.totalItems;

  /** Categorias reales del backend para el menu (RF-04). */
  readonly categorias = toSignal(this.productApi.obtenerCategorias(), { initialValue: [] });

  /** Estado de sesion para alternar el menu de cuenta (CU-04). */
  readonly estaAutenticado = this.auth.estaAutenticado;
  readonly usuario = this.auth.usuario;

  /** Controla el desplegable "Productos". */
  readonly productosAbierto = signal(false);
  /** Controla el desplegable de la cuenta del usuario. */
  readonly cuentaAbierta = signal(false);
  /** Controla la barra de búsqueda (RF-08). */
  readonly busquedaAbierta = signal(false);
  /** Controla el menú de navegación móvil (hamburguesa). */
  readonly menuMovilAbierto = signal(false);

  alternarProductos(): void {
    this.productosAbierto.update((abierto) => !abierto);
  }

  cerrarProductos(): void {
    this.productosAbierto.set(false);
  }

  alternarCuenta(): void {
    this.cuentaAbierta.update((abierto) => !abierto);
  }

  cerrarCuenta(): void {
    this.cuentaAbierta.set(false);
  }

  alternarMenuMovil(): void {
    this.menuMovilAbierto.update((abierto) => !abierto);
  }

  cerrarMenuMovil(): void {
    this.menuMovilAbierto.set(false);
  }

  alternarBusqueda(): void {
    this.busquedaAbierta.update((abierto) => !abierto);
  }

  cerrarBusqueda(): void {
    this.busquedaAbierta.set(false);
  }

  /** Navega a los resultados con el termino ingresado (RF-08/09/10). */
  buscar(termino: string): void {
    const consulta = termino.trim();
    if (!consulta) {
      return;
    }
    this.cerrarBusqueda();
    this.router.navigate(['/buscar'], { queryParams: { q: consulta } });
  }

  /** Cierra la sesion y vuelve al inicio. */
  cerrarSesion(): void {
    this.cerrarCuenta();
    this.cerrarMenuMovil();
    this.auth.logout();
    this.router.navigateByUrl('/inicio');
  }
}

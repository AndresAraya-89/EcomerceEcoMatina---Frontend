import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  Banner,
  Categoria,
  PaginaProductos,
  ProductoCard,
  ProductoDetalle,
  ProductoMasVendido,
  ProductoOferta,
  ResultadoBusqueda,
} from '../models/product.models';

/**
 * Acceso HTTP al catalogo (modulo `product`).
 *
 * Responsabilidad unica (SRP): consultar la API y entregar modelos limpios.
 * Actua de anti-corruption layer: el backend serializa los Decimal como texto
 * y aqui se convierten a `number` para que el resto de la app no lo sufra.
 */
@Injectable({ providedIn: 'root' })
export class ProductApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /** RF-01: productos en oferta para el home. */
  obtenerOfertas(): Observable<ProductoOferta[]> {
    return this.http
      .get<ProductoOferta[]>(`${this.baseUrl}/products/ofertas`)
      .pipe(map((lista) => lista.map((o) => this.aOferta(o))));
  }

  /** RF-02: productos mas vendidos para el home. */
  obtenerMasVendidos(): Observable<ProductoMasVendido[]> {
    return this.http
      .get<ProductoMasVendido[]>(`${this.baseUrl}/products/mas-vendidos`)
      .pipe(map((lista) => lista.map((p) => ({ ...p, precio_actual: Number(p.precio_actual) }))));
  }

  /** RF-04: categorias activas para el menu. */
  obtenerCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.baseUrl}/categories`);
  }

  /** RF-03: banners del carrusel del home. */
  obtenerBanners(): Observable<Banner[]> {
    return this.http.get<Banner[]>(`${this.baseUrl}/banners`);
  }

  /** RF-05: grilla paginada de productos de una categoria. */
  productosPorCategoria(codigo: string, pagina = 1): Observable<PaginaProductos> {
    const params = new HttpParams().set('page', pagina);
    return this.http
      .get<PaginaProductos>(`${this.baseUrl}/categories/${codigo}/products`, { params })
      .pipe(map((resp) => ({ ...resp, productos: resp.productos.map((p) => this.aCard(p)) })));
  }

  /** RF-08/09/10: busqueda con filtro opcional por categoria y paginacion. */
  buscar(consulta: string, categoria: string | null = null, pagina = 1): Observable<ResultadoBusqueda> {
    let params = new HttpParams().set('q', consulta).set('page', pagina);
    if (categoria) {
      params = params.set('categoria', categoria);
    }
    return this.http
      .get<ResultadoBusqueda>(`${this.baseUrl}/products/search`, { params })
      .pipe(map((resp) => ({ ...resp, productos: resp.productos.map((p) => this.aCard(p)) })));
  }

  /** RF-07: detalle de un producto con su galeria. */
  obtenerDetalle(codigo: string): Observable<ProductoDetalle> {
    return this.http
      .get<ProductoDetalle>(`${this.baseUrl}/products/${codigo}`)
      .pipe(
        map((d) => ({
          ...d,
          precio_actual: Number(d.precio_actual),
          precio_original: d.precio_original == null ? null : Number(d.precio_original),
        })),
      );
  }

  // ── Conversion Decimal(texto) -> number ────────────────────────────────

  private aCard(p: ProductoCard): ProductoCard {
    return {
      ...p,
      precio_actual: Number(p.precio_actual),
      precio_original: p.precio_original == null ? null : Number(p.precio_original),
    };
  }

  private aOferta(o: ProductoOferta): ProductoOferta {
    return {
      ...o,
      precio_original: Number(o.precio_original),
      precio_oferta: Number(o.precio_oferta),
    };
  }
}

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  FacturaDetalle,
  FacturaListItem,
  FacturaListResponse,
} from '../models/factura.models';

/**
 * Acceso HTTP al modulo "Mis Facturas" (RF-42..45).
 *
 * Responsabilidad unica (SRP): consultar `/api/v1/mis-facturas` y entregar
 * modelos limpios. Actua de anti-corruption layer: el backend serializa los
 * Decimal como texto y aqui se convierten a `number` para que la vista no lo
 * sufra. No conoce el token: el Authorization: Bearer lo agrega el interceptor.
 */
@Injectable({ providedIn: 'root' })
export class FacturaApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/mis-facturas`;

  /** RF-42/43: historial paginado del cliente, cronologico descendente. */
  listar(pagina = 1, porPagina = 20): Observable<FacturaListResponse> {
    const params = new HttpParams().set('pagina', pagina).set('por_pagina', porPagina);
    return this.http
      .get<FacturaListResponse>(this.url, { params })
      .pipe(map((resp) => ({ ...resp, items: resp.items.map((f) => this.aListItem(f)) })));
  }

  /** RF-44: detalle completo de una factura para el modal. */
  obtenerDetalle(numeroOrden: string): Observable<FacturaDetalle> {
    return this.http
      .get<FacturaDetalle>(`${this.url}/${numeroOrden}`)
      .pipe(map((d) => this.aDetalle(d)));
  }

  /**
   * RF-45: descarga el PDF del comprobante como blob. El endpoint responde un
   * 307 hacia el PDF almacenado; HttpClient sigue la redireccion y entrega el
   * binario. Un 409 (factura aun no disponible) llega como HttpErrorResponse.
   */
  descargarPdf(numeroOrden: string): Observable<Blob> {
    return this.http.get(`${this.url}/${numeroOrden}/pdf`, { responseType: 'blob' });
  }

  // ── Conversion Decimal(texto) -> number ────────────────────────────────────

  private aListItem(f: FacturaListItem): FacturaListItem {
    return { ...f, total: Number(f.total) };
  }

  private aDetalle(d: FacturaDetalle): FacturaDetalle {
    return {
      ...d,
      total: Number(d.total),
      productos: d.productos.map((p) => ({
        ...p,
        cantidad: Number(p.cantidad),
        precio_unitario: Number(p.precio_unitario),
        subtotal: Number(p.subtotal),
      })),
    };
  }
}

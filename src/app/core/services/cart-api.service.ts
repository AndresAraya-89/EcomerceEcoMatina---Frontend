import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ItemValidadoResponse,
  ResumenCarritoRequest,
  ResumenCarritoResponse,
  ValidarItemRequest,
} from '../models/cart.models';

/**
 * Acceso HTTP al modulo `cart` del backend.
 *
 * Responsabilidad unica (SRP): hablar con la API. No guarda estado ni conoce
 * sessionStorage. Los componentes nunca lo usan directo: pasan por CartService
 * (DIP — dependen de la abstraccion del store, no del transporte HTTP).
 *
 * El backend serializa los Decimal como texto ("38250.00", "2"); esta capa los
 * convierte a `number` para que el resto de la app trabaje con numeros limpios
 * (anti-corruption layer).
 */
@Injectable({ providedIn: 'root' })
export class CartApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/cart`;

  /** RF-12: valida stock/disponibilidad y devuelve el precio real del item. */
  validarItem(payload: ValidarItemRequest): Observable<ItemValidadoResponse> {
    return this.http
      .post<ItemValidadoResponse>(`${this.baseUrl}/validate-item`, payload)
      .pipe(
        map((r) => ({
          ...r,
          precio_unitario: Number(r.precio_unitario),
          cantidad: Number(r.cantidad),
          subtotal: Number(r.subtotal),
        })),
      );
  }

  /** RF-14: recalcula precios y total general de forma segura en el backend. */
  obtenerResumen(payload: ResumenCarritoRequest): Observable<ResumenCarritoResponse> {
    return this.http
      .post<ResumenCarritoResponse>(`${this.baseUrl}/summary`, payload)
      .pipe(
        map((r) => ({
          total_general: Number(r.total_general),
          items_validados: r.items_validados.map((l) => ({
            ...l,
            precio_unitario: Number(l.precio_unitario),
            cantidad_procesada: Number(l.cantidad_procesada),
            subtotal: Number(l.subtotal),
          })),
        })),
      );
  }
}

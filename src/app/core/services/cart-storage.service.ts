import { Injectable } from '@angular/core';

import { CartItem } from '../models/cart.models';

const CART_STORAGE_KEY = 'agromatina_cart';

/**
 * Persistencia del carrito en sessionStorage (RF-16).
 *
 * Responsabilidad unica (SRP): leer/escribir el carrito. Aislar esto permite
 * cambiar el mecanismo (localStorage, IndexedDB) sin tocar la logica de negocio
 * del CartService.
 */
@Injectable({ providedIn: 'root' })
export class CartStorageService {
  /** Carga el carrito guardado; retorna lista vacia si no hay nada o el JSON es invalido. */
  cargar(): CartItem[] {
    const data = sessionStorage.getItem(CART_STORAGE_KEY);
    if (!data) {
      return [];
    }
    try {
      return JSON.parse(data) as CartItem[];
    } catch {
      return [];
    }
  }

  /** Guarda el carrito completo. */
  guardar(items: CartItem[]): void {
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }

  /** Vacia el carrito persistido. */
  limpiar(): void {
    sessionStorage.removeItem(CART_STORAGE_KEY);
  }
}

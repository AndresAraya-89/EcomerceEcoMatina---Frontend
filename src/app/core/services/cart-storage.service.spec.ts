import { TestBed } from '@angular/core/testing';

import { CartStorageService } from './cart-storage.service';
import { buildCartItem } from '../../testing';

/**
 * Persistencia del carrito. Karma corre en un navegador real, asi que
 * `sessionStorage` existe; lo limpiamos entre pruebas para aislarlas.
 */
describe('CartStorageService', () => {
  let service: CartStorageService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(CartStorageService);
  });

  afterEach(() => sessionStorage.clear());

  it('devuelve lista vacia cuando no hay nada guardado', () => {
    expect(service.cargar()).toEqual([]);
  });

  it('guarda y recupera los items (ida y vuelta)', () => {
    const items = [buildCartItem(), buildCartItem({ codigo_producto: 'PROD-002', cantidad: 4 })];
    service.guardar(items);
    expect(service.cargar()).toEqual(items);
  });

  it('devuelve lista vacia si el JSON guardado esta corrupto', () => {
    sessionStorage.setItem('agromatina_cart', '{no es json valido');
    expect(service.cargar()).toEqual([]);
  });

  it('limpiar() borra el carrito persistido', () => {
    service.guardar([buildCartItem()]);
    service.limpiar();
    expect(service.cargar()).toEqual([]);
  });
});

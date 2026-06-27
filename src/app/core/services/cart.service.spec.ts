import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { CartService } from './cart.service';
import { CartApiService } from './cart-api.service';
import { CartStorageService } from './cart-storage.service';
import { buildItemValidado, buildResumen } from '../../testing';

/**
 * Tests del facade del carrito (la logica de negocio mas critica de la app).
 *
 * Se aisla con dobles de prueba: un `CartApiService` espiado (sin HTTP real) y un
 * `CartStorageService` falso en memoria. Asi se prueba la reconciliacion con el
 * backend y las reglas de las operaciones, no el transporte ni el storage (esos
 * tienen sus propios specs). Las respuestas usan `of(...)` para resolver de forma
 * sincrona y mantener los tests simples.
 */
describe('CartService (facade)', () => {
  let service: CartService;
  let api: jasmine.SpyObj<CartApiService>;
  let storage: Pick<CartStorageService, 'cargar' | 'guardar' | 'limpiar'>;

  /** Construye el facade con los dobles ya configurados para cada test. */
  function crearServicio(): CartService {
    return TestBed.inject(CartService);
  }

  beforeEach(() => {
    api = jasmine.createSpyObj<CartApiService>('CartApiService', [
      'validarItem',
      'obtenerResumen',
    ]);
    storage = { cargar: () => [], guardar: () => {}, limpiar: () => {} };

    TestBed.configureTestingModule({
      providers: [
        { provide: CartApiService, useValue: api },
        { provide: CartStorageService, useValue: storage },
      ],
    });
  });

  it('arranca vacio cuando el storage no tiene nada', () => {
    service = crearServicio();
    expect(service.vacio()).toBeTrue();
    expect(service.totalItems()).toBe(0);
    expect(api.obtenerResumen).not.toHaveBeenCalled();
  });

  it('agregar(): valida el item y reconcilia el carrito con el resumen del backend', () => {
    api.validarItem.and.returnValue(
      of(buildItemValidado({ codigo_producto: 'PROD-001', cantidad: 2, subtotal: 200 })),
    );
    api.obtenerResumen.and.returnValue(
      of(
        buildResumen({
          items_validados: [
            {
              codigo_producto: 'PROD-001',
              nombre: 'Motobomba 2"',
              precio_unitario: 100,
              cantidad_procesada: 2,
              subtotal: 200,
              advertencia: null,
            },
          ],
          total_general: 200,
        }),
      ),
    );

    service = crearServicio();
    service.agregar('PROD-001', 2);

    expect(api.validarItem).toHaveBeenCalledWith({ codigo_producto: 'PROD-001', cantidad: 2 });
    expect(service.items().length).toBe(1);
    expect(service.items()[0].cantidad).toBe(2);
    expect(service.totalGeneral()).toBe(200);
    expect(service.totalItems()).toBe(2);
    expect(service.vacio()).toBeFalse();
    expect(service.cargando()).toBeFalse();
  });

  it('agregar(): el backend manda — si recorta la cantidad, expone su advertencia', () => {
    // Pedimos 5 pero el stock solo permite 3.
    api.validarItem.and.returnValue(
      of(buildItemValidado({ codigo_producto: 'PROD-001', cantidad: 5 })),
    );
    api.obtenerResumen.and.returnValue(
      of(
        buildResumen({
          items_validados: [
            {
              codigo_producto: 'PROD-001',
              nombre: 'Motobomba 2"',
              precio_unitario: 100,
              cantidad_procesada: 3,
              subtotal: 300,
              advertencia: 'Stock ajustado a 3 unidades',
            },
          ],
          total_general: 300,
        }),
      ),
    );

    service = crearServicio();
    service.agregar('PROD-001', 5);

    expect(service.items()[0].cantidad).toBe(3);
    expect(service.advertencias()).toEqual(['Stock ajustado a 3 unidades']);
  });

  it('agregar(): ante un error HTTP publica el mensaje del backend y no toca el carrito', () => {
    api.validarItem.and.returnValue(
      throwError(() => ({ error: { detail: 'Producto sin stock' } })),
    );

    service = crearServicio();
    service.agregar('PROD-001', 1);

    expect(service.error()).toBe('Producto sin stock');
    expect(service.vacio()).toBeTrue();
    expect(api.obtenerResumen).not.toHaveBeenCalled();
  });

  it('actualizarCantidad(0): elimina la linea y deja el carrito vacio', () => {
    api.validarItem.and.returnValue(of(buildItemValidado({ codigo_producto: 'PROD-001' })));
    api.obtenerResumen.and.returnValue(of(buildResumen()));

    service = crearServicio();
    service.agregar('PROD-001', 1);
    expect(service.vacio()).toBeFalse();

    service.actualizarCantidad('PROD-001', 0);

    expect(service.vacio()).toBeTrue();
    expect(service.totalGeneral()).toBe(0);
  });

  it('vaciar(): limpia items, total y storage', () => {
    const limpiarSpy = spyOn(storage, 'limpiar');
    api.validarItem.and.returnValue(of(buildItemValidado()));
    api.obtenerResumen.and.returnValue(of(buildResumen()));

    service = crearServicio();
    service.agregar('PROD-001', 1);
    service.vaciar();

    expect(service.vacio()).toBeTrue();
    expect(service.totalGeneral()).toBe(0);
    expect(limpiarSpy).toHaveBeenCalled();
  });
});

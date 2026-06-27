import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { CartApiService } from './cart-api.service';
import { environment } from '../../../environments/environment';

/**
 * Verifica el contrato HTTP y, sobre todo, la capa anti-corruption: el backend
 * serializa los Decimal como TEXTO ("38250.00") y este servicio debe entregarlos
 * como `number` al resto de la app.
 */
describe('CartApiService', () => {
  let service: CartApiService;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/cart`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CartApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('validarItem: POST a /validate-item y convierte los montos texto a number', () => {
    let recibido: unknown;
    service
      .validarItem({ codigo_producto: 'PROD-001', cantidad: 2 })
      .subscribe((r) => (recibido = r));

    const req = http.expectOne(`${base}/validate-item`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ codigo_producto: 'PROD-001', cantidad: 2 });

    // El backend responde con strings (Decimal serializado).
    req.flush({
      codigo_producto: 'PROD-001',
      nombre: 'Motobomba 2"',
      precio_unitario: '38250.00',
      cantidad: '2',
      subtotal: '76500.00',
    });

    expect(recibido).toEqual({
      codigo_producto: 'PROD-001',
      nombre: 'Motobomba 2"',
      precio_unitario: 38250,
      cantidad: 2,
      subtotal: 76500,
    });
  });

  it('obtenerResumen: POST a /summary y normaliza total y lineas a number', () => {
    let recibido: any;
    service
      .obtenerResumen({ items: [{ codigo_producto: 'PROD-001', cantidad: 2 }] })
      .subscribe((r) => (recibido = r));

    const req = http.expectOne(`${base}/summary`);
    expect(req.request.method).toBe('POST');

    req.flush({
      total_general: '76500.00',
      items_validados: [
        {
          codigo_producto: 'PROD-001',
          nombre: 'Motobomba 2"',
          precio_unitario: '38250.00',
          cantidad_procesada: '2',
          subtotal: '76500.00',
          advertencia: null,
        },
      ],
    });

    expect(recibido.total_general).toBe(76500);
    expect(recibido.items_validados[0].precio_unitario).toBe(38250);
    expect(recibido.items_validados[0].cantidad_procesada).toBe(2);
    expect(recibido.items_validados[0].subtotal).toBe(76500);
  });
});

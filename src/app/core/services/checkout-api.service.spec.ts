import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { CheckoutApiService } from './checkout-api.service';
import { environment } from '../../../environments/environment';
import { PedidoCreate, PedidoOut } from '../models/checkout.models';

/**
 * Contrato HTTP del modulo checkout. Como el carrito, el backend serializa el
 * total (Decimal) como TEXTO; el servicio debe entregarlo como `number`. Tambien
 * cubre el paso clave del flujo PayPal en ventana emergente: la CAPTURA del pago.
 */
describe('CheckoutApiService', () => {
  let service: CheckoutApiService;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/checkout`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CheckoutApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('crearPedido: POST a /checkout/ con el payload y normaliza el total a number', () => {
    const payload: PedidoCreate = {
      cliente_id: 1,
      metodo_pago: 'paypal',
      items: [
        {
          producto_codigo: 'PROD-001',
          producto_nombre: 'Motobomba 2"',
          cantidad: 2,
          precio_unitario: 100,
        },
      ],
    };
    let recibido: PedidoOut | undefined;

    service.crearPedido(payload).subscribe((p) => (recibido = p));

    const req = http.expectOne(`${base}/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);

    // El backend responde con el total como texto (Decimal serializado).
    req.flush({
      numero_orden: 'ORD-0001',
      estado: 'pendiente_pago',
      total: '200.00',
      mensaje: 'Continua el pago en PayPal.',
      detalles_pago: {
        accion: 'PAYMENT_GATEWAY_REDIRECT',
        url_pasarela: 'https://www.sandbox.paypal.com/checkoutnow?token=ORDER123',
      },
    });

    expect(recibido?.total).toBe(200);
    expect(typeof recibido?.total).toBe('number');
    expect(recibido?.detalles_pago.accion).toBe('PAYMENT_GATEWAY_REDIRECT');
  });

  it('capturarPagoPaypal: POST a /paypal/capturar con el paypal_order_id y total number', () => {
    let recibido: PedidoOut | undefined;

    service.capturarPagoPaypal('ORDER123').subscribe((p) => (recibido = p));

    const req = http.expectOne(`${base}/paypal/capturar`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ paypal_order_id: 'ORDER123' });

    req.flush({
      numero_orden: 'ORD-0001',
      estado: 'pagado',
      total: '200.00',
      mensaje: 'Pago confirmado.',
      detalles_pago: {},
    });

    expect(recibido?.estado).toBe('pagado');
    expect(recibido?.total).toBe(200);
  });

  it('capturarPagoPaypal: propaga el error HTTP cuando la captura falla', () => {
    let error: unknown;

    service.capturarPagoPaypal('ORDER123').subscribe({
      next: () => fail('no deberia emitir valor'),
      error: (e) => (error = e),
    });

    const req = http.expectOne(`${base}/paypal/capturar`);
    req.flush({ detail: 'Orden no aprobada' }, { status: 422, statusText: 'Unprocessable' });

    expect((error as { status?: number })?.status).toBe(422);
  });

  it('urlPdf: arma la URL del comprobante escapando el numero de orden', () => {
    expect(service.urlPdf('ORD-0001')).toBe(`${base}/ORD-0001/pdf`);
    expect(service.urlPdf('ORD 1/2')).toBe(`${base}/ORD%201%2F2/pdf`);
  });
});

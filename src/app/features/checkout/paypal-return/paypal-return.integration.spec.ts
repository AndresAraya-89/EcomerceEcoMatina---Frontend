import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { PaypalReturn } from './paypal-return';
import { PAYPAL_CANAL, PAYPAL_POPUP_FLAG } from '../../../core/services/paypal-popup.service';
import { environment } from '../../../../environments/environment';
import { buildPedidoOut } from '../../../testing';

/**
 * Pruebas de INTEGRACION de la página de retorno de PayPal: componente real +
 * `CheckoutApiService` real + `PaypalPopupService` real, con la frontera HTTP
 * simulada. Verifican la CAPTURA del pago (POST /checkout/paypal/capturar) y los
 * dos contextos de ejecución: dentro de la ventana emergente (avisa y cierra) y
 * como página completa (renderiza la confirmación).
 *
 * Nota: la captura usa `resource()` (asíncrono); se espera con macrotareas
 * (setTimeout) en lugar de `whenStable()`, que se colgaría con el HTTP pendiente.
 */
describe('PaypalReturn [integracion]', () => {
  let fixture: ComponentFixture<PaypalReturn>;
  let http: HttpTestingController;

  const base = environment.apiUrl;
  const tic = () => new Promise<void>((r) => setTimeout(r, 0));

  function configurar(token: string): void {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: of(convertToParamMap({ token })) },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  }

  afterEach(() => localStorage.clear());

  it('como página completa: captura el pago y muestra la confirmación', async () => {
    localStorage.clear(); // sin bandera => no es popup
    configurar('ORDER123');

    fixture = TestBed.createComponent(PaypalReturn);
    fixture.detectChanges();
    await tic(); // el resource dispara la captura (HTTP)

    const req = http.expectOne(`${base}/checkout/paypal/capturar`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ paypal_order_id: 'ORDER123' });
    req.flush(buildPedidoOut({ numero_orden: 'ORD-9', estado: 'pagado', detalles_pago: {} }));

    await tic(); // el resource resuelve el valor
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('¡Pago confirmado!');
    expect(texto).toContain('ORD-9');
  });

  it('dentro de la ventana emergente: captura, avisa el resultado y cierra', async () => {
    localStorage.setItem(PAYPAL_POPUP_FLAG, '1'); // marca de popup activo
    const cerrar = spyOn(window, 'close');

    // La pestaña original escucha el canal.
    const recibidos: string[] = [];
    const canal = new BroadcastChannel(PAYPAL_CANAL);
    canal.onmessage = (e: MessageEvent<string>) => recibidos.push(e.data);

    configurar('ORDER123');

    fixture = TestBed.createComponent(PaypalReturn);
    fixture.detectChanges();
    await tic();

    http
      .expectOne(`${base}/checkout/paypal/capturar`)
      .flush(buildPedidoOut({ estado: 'pagado', detalles_pago: {} }));

    await tic();
    fixture.detectChanges(); // dispara el effect que avisa y cierra
    await new Promise<void>((r) => setTimeout(r, 50)); // el canal entrega el mensaje

    expect(recibidos).toContain('completado');
    expect(cerrar).toHaveBeenCalled();
    canal.close();
  });
});

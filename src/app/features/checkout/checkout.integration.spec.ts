import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { Checkout } from './checkout';
import { AuthService } from '../../core/services/auth.service';
import {
  PAYPAL_CANAL,
  PAYPAL_POPUP_FLAG,
} from '../../core/services/paypal-popup.service';
import { environment } from '../../../environments/environment';
import { buildPedidoOut, buildResumen, buildUsuarioActual } from '../../testing';

/**
 * Pruebas de INTEGRACION del checkout: se montan juntos el componente, el
 * `CartService`, el `CheckoutApiService`, el `PaypalPopupService` y la plantilla
 * REALES; solo se simula la frontera HTTP (`HttpTestingController`) y el
 * `window.open` del navegador. Verifican el flujo completo carrito -> pedido ->
 * pago en ventana emergente, no piezas aisladas.
 */
describe('Checkout [integracion]', () => {
  let fixture: ComponentFixture<Checkout>;
  let http: HttpTestingController;
  let ventanaFalsa: { closed: boolean; close: jasmine.Spy };

  const base = environment.apiUrl;

  /** Botón cuyo texto contiene `texto`, dentro del componente renderizado. */
  function boton(texto: string): HTMLButtonElement | undefined {
    const el = fixture.nativeElement as HTMLElement;
    return Array.from(el.querySelectorAll('button')).find((b) =>
      b.textContent?.includes(texto),
    ) as HTMLButtonElement | undefined;
  }

  /** Texto visible del componente. */
  function texto(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  /** Selecciona un método de pago por índice (0 = SINPE, 1 = PayPal) y refresca. */
  function elegirMetodo(indice: number): void {
    const radios = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>(
      'input[type=radio]',
    );
    radios[indice].click();
    fixture.detectChanges();
  }

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();

    // Carrito sembrado: una motobomba. El CartService real lo cargará al construirse.
    sessionStorage.setItem(
      'agromatina_cart',
      JSON.stringify([
        { codigo_producto: 'PROD-001', nombre: 'Motobomba 2"', precio_unitario: 100, cantidad: 1, subtotal: 100 },
      ]),
    );

    // El AuthService es periférico al flujo de pago: se sustituye solo por la identidad.
    const auth = { usuario: signal(buildUsuarioActual({ cliente_id: 7 })) };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: auth },
      ],
    });

    http = TestBed.inject(HttpTestingController);
    ventanaFalsa = { closed: false, close: jasmine.createSpy('close') };
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  /** Crea el componente y resuelve el /cart/summary que dispara el CartService. */
  function iniciar(): void {
    fixture = TestBed.createComponent(Checkout);
    fixture.detectChanges();
    // El CartService reconcilia el carrito sembrado contra el backend.
    http.expectOne(`${base}/cart/summary`).flush(buildResumen({ total_general: 100 }));
    fixture.detectChanges();
  }

  it('muestra el resumen del carrito reconciliado por el backend', () => {
    iniciar();

    expect(texto()).toContain('Finalizar compra');
    expect(texto()).toContain('Motobomba 2"');
    // El total seguro proviene del backend (/cart/summary).
    expect(texto()).toContain('100');
  });

  it('confirmar con PayPal: crea el pedido y ofrece el botón de pago', () => {
    iniciar();
    elegirMetodo(1); // PayPal

    boton('Confirmar pedido')!.click();

    const req = http.expectOne(`${base}/checkout/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.metodo_pago).toBe('paypal');
    expect(req.request.body.cliente_id).toBe(7);
    req.flush(buildPedidoOut({ numero_orden: 'ORD-0001' }));
    fixture.detectChanges();

    expect(texto()).toContain('¡Pedido confirmado!');
    expect(texto()).toContain('ORD-0001');
    expect(boton('Pagar con PayPal')).toBeTruthy();
  });

  it('pago con PayPal completado: abre el popup y muestra la confirmación', async () => {
    const open = spyOn(window, 'open').and.returnValue(ventanaFalsa as unknown as Window);
    iniciar();
    elegirMetodo(1); // PayPal

    boton('Confirmar pedido')!.click();
    http.expectOne(`${base}/checkout/`).flush(buildPedidoOut());
    fixture.detectChanges();

    // Click en "Pagar con PayPal": el PaypalPopupService real abre la ventana.
    boton('Pagar con PayPal')!.click();
    fixture.detectChanges();
    expect(open).toHaveBeenCalled();
    expect(localStorage.getItem(PAYPAL_POPUP_FLAG)).toBe('1');
    expect(texto()).toContain('Esperando el pago en PayPal');

    // La ventana emergente (otra pestaña del mismo origen) anuncia el éxito.
    const canal = new BroadcastChannel(PAYPAL_CANAL);
    canal.postMessage('completado');
    canal.close();
    await new Promise<void>((r) => setTimeout(r, 50));
    fixture.detectChanges();

    expect(ventanaFalsa.close).toHaveBeenCalled();
    expect(texto()).toContain('Pago confirmado con PayPal');
  });

  it('confirmar con SINPE: muestra las instrucciones de pago fuera de línea', () => {
    iniciar();
    elegirMetodo(0); // SINPE (primero en la lista)

    boton('Confirmar pedido')!.click();

    const req = http.expectOne(`${base}/checkout/`);
    expect(req.request.body.metodo_pago).toBe('sinpe');
    req.flush(
      buildPedidoOut({
        estado: 'pendiente_pago',
        mensaje: 'Pedido recibido.',
        detalles_pago: {
          accion: 'WHATSAPP_REDIRECT',
          instrucciones: 'Realizá el SINPE Móvil al 8888-8888 y enviá el comprobante.',
        },
      }),
    );
    fixture.detectChanges();

    expect(texto()).toContain('Instrucciones de pago');
    expect(texto()).toContain('SINPE Móvil al 8888-8888');
    expect(boton('Pagar con PayPal')).toBeFalsy();
  });
});

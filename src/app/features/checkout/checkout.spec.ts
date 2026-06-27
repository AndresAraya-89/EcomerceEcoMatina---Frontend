import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Checkout } from './checkout';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { CheckoutApiService } from '../../core/services/checkout-api.service';
import { PaypalPopupService, ResultadoPaypal } from '../../core/services/paypal-popup.service';
import { buildUsuarioActual } from '../../testing';

/**
 * Tests del componente de checkout, centrados en la maquina de estados del pago
 * con PayPal en ventana emergente (`pagarConPaypal`). El `PaypalPopupService` se
 * sustituye por un doble que emite el desenlace, sin abrir ventanas reales. No se
 * renderiza la plantilla: se prueba la logica del componente, no el HTML.
 */
describe('Checkout (PayPal en ventana emergente)', () => {
  let paypal: jasmine.SpyObj<PaypalPopupService>;
  let api: jasmine.SpyObj<CheckoutApiService>;

  const URL = 'https://www.sandbox.paypal.com/checkoutnow?token=ORDER123';

  function crearComponente(): Checkout {
    return TestBed.createComponent(Checkout).componentInstance;
  }

  /** Configura el doble del popup para que emita el resultado indicado. */
  function popupEmite(resultado: ResultadoPaypal): void {
    paypal.abrir.and.returnValue(of(resultado));
  }

  beforeEach(() => {
    paypal = jasmine.createSpyObj<PaypalPopupService>('PaypalPopupService', [
      'abrir',
      'enVentanaEmergente',
      'notificarYCerrar',
    ]);
    api = jasmine.createSpyObj<CheckoutApiService>('CheckoutApiService', ['crearPedido', 'urlPdf']);

    const cart = {
      items: signal([]),
      totalGeneral: signal(0),
      cargando: signal(false),
      vacio: signal(false),
      vaciar: jasmine.createSpy('vaciar'),
    };
    const auth = { usuario: signal(buildUsuarioActual({ cliente_id: 7 })) };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: CartService, useValue: cart },
        { provide: AuthService, useValue: auth },
        { provide: CheckoutApiService, useValue: api },
        { provide: PaypalPopupService, useValue: paypal },
      ],
    });
  });

  it('arranca con el pago de PayPal inactivo y sin popup bloqueado', () => {
    const comp = crearComponente();
    expect(comp.estadoPaypal()).toBe('inactivo');
    expect(comp.popupBloqueado()).toBeFalse();
  });

  it('pagarConPaypal: abre la pasarela con la URL recibida', () => {
    popupEmite('completado');
    const comp = crearComponente();

    comp.pagarConPaypal(URL);

    expect(paypal.abrir).toHaveBeenCalledOnceWith(URL);
  });

  it('pagarConPaypal: "completado" deja el estado en completado', () => {
    popupEmite('completado');
    const comp = crearComponente();

    comp.pagarConPaypal(URL);

    expect(comp.estadoPaypal()).toBe('completado');
    expect(comp.popupBloqueado()).toBeFalse();
  });

  it('pagarConPaypal: "cancelado" deja el estado en cancelado', () => {
    popupEmite('cancelado');
    const comp = crearComponente();

    comp.pagarConPaypal(URL);

    expect(comp.estadoPaypal()).toBe('cancelado');
  });

  it('pagarConPaypal: "error" deja el estado en error', () => {
    popupEmite('error');
    const comp = crearComponente();

    comp.pagarConPaypal(URL);

    expect(comp.estadoPaypal()).toBe('error');
  });

  it('pagarConPaypal: "bloqueado" no marca el pago y enciende popupBloqueado', () => {
    popupEmite('bloqueado');
    const comp = crearComponente();

    comp.pagarConPaypal(URL);

    expect(comp.estadoPaypal()).toBe('inactivo');
    expect(comp.popupBloqueado()).toBeTrue();
  });

  it('pagarConPaypal: un reintento limpia el bloqueo del intento anterior', () => {
    const comp = crearComponente();

    popupEmite('bloqueado');
    comp.pagarConPaypal(URL);
    expect(comp.popupBloqueado()).toBeTrue();

    popupEmite('completado');
    comp.pagarConPaypal(URL);
    expect(comp.popupBloqueado()).toBeFalse();
    expect(comp.estadoPaypal()).toBe('completado');
  });
});

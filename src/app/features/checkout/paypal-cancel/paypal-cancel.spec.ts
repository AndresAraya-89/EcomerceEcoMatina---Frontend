import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { PaypalCancel } from './paypal-cancel';
import { PaypalPopupService } from '../../../core/services/paypal-popup.service';

/**
 * Pagina de cancelacion de PayPal (destino de PAYPAL_CANCEL_URL). Dentro de la
 * ventana emergente debe avisar la cancelacion a la pestana original y cerrarse;
 * como pagina completa, no toca nada y muestra la vista normal.
 */
describe('PaypalCancel', () => {
  let paypal: jasmine.SpyObj<PaypalPopupService>;

  function configurar(enPopup: boolean): void {
    paypal = jasmine.createSpyObj<PaypalPopupService>('PaypalPopupService', [
      'enVentanaEmergente',
      'notificarYCerrar',
    ]);
    paypal.enVentanaEmergente.and.returnValue(enPopup);

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: PaypalPopupService, useValue: paypal }],
    });
  }

  it('dentro del popup: avisa "cancelado" y marca enPopup', () => {
    configurar(true);
    const comp = TestBed.createComponent(PaypalCancel).componentInstance;

    expect(comp.enPopup).toBeTrue();
    expect(paypal.notificarYCerrar).toHaveBeenCalledOnceWith('cancelado');
  });

  it('como pagina completa: no avisa ni cierra', () => {
    configurar(false);
    const comp = TestBed.createComponent(PaypalCancel).componentInstance;

    expect(comp.enPopup).toBeFalse();
    expect(paypal.notificarYCerrar).not.toHaveBeenCalled();
  });
});

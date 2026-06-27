import { TestBed } from '@angular/core/testing';

import {
  PAYPAL_CANAL,
  PAYPAL_POPUP_FLAG,
  PAYPAL_VENTANA,
  PaypalPopupService,
  ResultadoPaypal,
} from './paypal-popup.service';

/**
 * Tests del servicio que abre la pasarela de PayPal en una ventana emergente.
 *
 * El reto del feature es no perder la sesion: el pago corre en un popup y el
 * resultado vuelve por `BroadcastChannel`, mientras la deteccion "estoy dentro del
 * popup" se apoya en una bandera de `localStorage` (resistente a las cabeceras COOP
 * de PayPal, a diferencia de `window.name`). Aqui se aisla `window.open` con un
 * doble y se usa el `BroadcastChannel` real de Chrome para verificar la mensajeria.
 */
describe('PaypalPopupService', () => {
  let service: PaypalPopupService;
  let ventanaFalsa: { closed: boolean; close: jasmine.Spy };

  const URL_PASARELA = 'https://www.sandbox.paypal.com/checkoutnow?token=ORDER123';

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(PaypalPopupService);

    // Doble de la ventana emergente: no abrimos ventanas reales en los tests.
    ventanaFalsa = { closed: false, close: jasmine.createSpy('close') };
  });

  afterEach(() => localStorage.clear());

  /** Espia window.open devolviendo la ventana falsa (o null para simular bloqueo). */
  function espiarOpen(resultado: Window | null): jasmine.Spy {
    return spyOn(window, 'open').and.returnValue(resultado as Window | null);
  }

  describe('abrir()', () => {
    it('abre window.open con la URL y el nombre de la ventana, y marca la bandera', () => {
      const open = espiarOpen(ventanaFalsa as unknown as Window);

      const sub = service.abrir(URL_PASARELA).subscribe();

      expect(open).toHaveBeenCalledTimes(1);
      const [url, nombre, features] = open.calls.mostRecent().args;
      expect(url).toBe(URL_PASARELA);
      expect(nombre).toBe(PAYPAL_VENTANA);
      expect(features as string).toContain('popup=yes');
      // La bandera queda puesta ANTES de viajar a PayPal, para el viaje de vuelta.
      expect(localStorage.getItem(PAYPAL_POPUP_FLAG)).toBe('1');

      sub.unsubscribe();
    });

    it('si el navegador bloquea el popup emite "bloqueado" y no deja la bandera', () => {
      espiarOpen(null);
      let resultado: ResultadoPaypal | undefined;
      let completado = false;

      service.abrir(URL_PASARELA).subscribe({
        next: (r) => (resultado = r),
        complete: () => (completado = true),
      });

      expect(resultado).toBe('bloqueado');
      expect(completado).toBeTrue();
      expect(localStorage.getItem(PAYPAL_POPUP_FLAG)).toBeNull();
    });

    it('resuelve "completado" cuando llega el mensaje del canal y cierra la ventana', (done) => {
      espiarOpen(ventanaFalsa as unknown as Window);

      service.abrir(URL_PASARELA).subscribe((r) => {
        expect(r).toBe('completado');
        expect(ventanaFalsa.close).toHaveBeenCalled();
        done();
      });

      // El popup (otra pestana del mismo origen) publica el desenlace.
      const canal = new BroadcastChannel(PAYPAL_CANAL);
      canal.postMessage('completado' as ResultadoPaypal);
      canal.close();
    });

    it('propaga "cancelado" cuando el canal lo anuncia (link "volver al comercio")', (done) => {
      espiarOpen(ventanaFalsa as unknown as Window);

      service.abrir(URL_PASARELA).subscribe((r) => {
        expect(r).toBe('cancelado');
        done();
      });

      const canal = new BroadcastChannel(PAYPAL_CANAL);
      canal.postMessage('cancelado' as ResultadoPaypal);
      canal.close();
    });

    it('infiere "cancelado" si el usuario cierra la ventana a mano (sin mensaje)', (done) => {
      jasmine.clock().install();
      espiarOpen(ventanaFalsa as unknown as Window);

      service.abrir(URL_PASARELA).subscribe((r) => {
        expect(r).toBe('cancelado');
        jasmine.clock().uninstall();
        done();
      });

      // El vigilante detecta el cierre manual en su proximo tick.
      ventanaFalsa.closed = true;
      jasmine.clock().tick(600);
    });

    it('al desuscribirse limpia la bandera y cierra la ventana si sigue abierta', () => {
      espiarOpen(ventanaFalsa as unknown as Window);

      const sub = service.abrir(URL_PASARELA).subscribe();
      expect(localStorage.getItem(PAYPAL_POPUP_FLAG)).toBe('1');

      sub.unsubscribe();

      expect(localStorage.getItem(PAYPAL_POPUP_FLAG)).toBeNull();
      expect(ventanaFalsa.close).toHaveBeenCalled();
    });

    it('emite un unico resultado: el mensaje posterior al primero se ignora', (done) => {
      espiarOpen(ventanaFalsa as unknown as Window);
      const recibidos: ResultadoPaypal[] = [];

      service.abrir(URL_PASARELA).subscribe({
        next: (r) => recibidos.push(r),
        complete: () => {
          expect(recibidos).toEqual(['completado']);
          done();
        },
      });

      const canal = new BroadcastChannel(PAYPAL_CANAL);
      canal.postMessage('completado' as ResultadoPaypal);
      canal.postMessage('error' as ResultadoPaypal);
      canal.close();
    });
  });

  describe('enVentanaEmergente()', () => {
    it('es true solo cuando la bandera de localStorage esta puesta', () => {
      expect(service.enVentanaEmergente()).toBeFalse();

      localStorage.setItem(PAYPAL_POPUP_FLAG, '1');
      expect(service.enVentanaEmergente()).toBeTrue();

      localStorage.removeItem(PAYPAL_POPUP_FLAG);
      expect(service.enVentanaEmergente()).toBeFalse();
    });
  });

  describe('notificarYCerrar()', () => {
    it('publica el resultado por el canal y cierra la ventana', (done) => {
      const cerrar = spyOn(window, 'close');

      const canal = new BroadcastChannel(PAYPAL_CANAL);
      canal.onmessage = (e: MessageEvent<ResultadoPaypal>) => {
        expect(e.data).toBe('completado');
        expect(cerrar).toHaveBeenCalled();
        canal.close();
        done();
      };

      service.notificarYCerrar('completado');
    });
  });
});

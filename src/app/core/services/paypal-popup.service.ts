import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

/** Nombre de la ventana emergente de PayPal (2º arg de `window.open`). */
export const PAYPAL_VENTANA = 'ventana-paypal';

/**
 * Bandera en `localStorage` que indica que hay un pago de PayPal en curso dentro
 * de una ventana emergente. La pone la pestaña que abre el popup y la borra al
 * terminar. Las páginas de retorno/cancelación la consultan para saber que corren
 * dentro del popup.
 *
 * Por qué localStorage y no `window.name`/`window.opener`: PayPal sirve sus páginas
 * con cabeceras COOP que, al navegar a su dominio y volver al return_url, borran
 * `window.name` y rompen `window.opener`. `localStorage` (mismo origen) sí sobrevive
 * al viaje de ida y vuelta.
 */
export const PAYPAL_POPUP_FLAG = 'paypal-popup-activo';

/**
 * Canal de mensajería entre el popup y la pestaña que lo abrió. `BroadcastChannel`
 * funciona entre contextos del MISMO origen sin depender de `window.opener` (que
 * PayPal podría romper con cabeceras COOP). El return_url vuelve a nuestro origen,
 * así que ambos lados comparten el canal.
 */
export const PAYPAL_CANAL = 'paypal-pago';

/** Desenlace de la pasarela tal como lo recibe la pestaña original. */
export type ResultadoPaypal = 'completado' | 'cancelado' | 'error' | 'bloqueado';

/**
 * Abre la pasarela de PayPal en una ventana emergente y avisa del resultado.
 *
 * Responsabilidad única (SRP): gestionar la ventana emergente y su canal. Mantener
 * la app en la pestaña original evita el arranque en frío al volver de PayPal y,
 * con él, el riesgo de perder la sesión. El popup ejecuta el pago y la captura;
 * al terminar publica el resultado por `BroadcastChannel` y se cierra.
 */
@Injectable({ providedIn: 'root' })
export class PaypalPopupService {
  private static readonly ANCHO = 480;
  private static readonly ALTO = 720;

  /**
   * Abre `url` en una ventana emergente centrada y emite UN único resultado:
   *   - `completado` / `error`: lo publica la página de retorno tras la captura.
   *   - `cancelado`: lo publica la página de cancelación, o se infiere si el
   *     usuario cierra la ventana a mano.
   *   - `bloqueado`: el navegador impidió abrir la ventana (el llamador decide
   *     el plan B, p. ej. ofrecer el enlace directo).
   *
   * Al desuscribirse limpia el canal, el temporizador y cierra la ventana.
   */
  abrir(url: string): Observable<ResultadoPaypal> {
    return new Observable<ResultadoPaypal>((subscriber) => {
      // Marcamos el pago en curso ANTES de abrir: así, cuando la ventana vuelva
      // del return_url, su página de retorno sabe que está dentro del popup.
      localStorage.setItem(PAYPAL_POPUP_FLAG, '1');
      const ventana = window.open(url, PAYPAL_VENTANA, this.caracteristicas());

      if (!ventana) {
        localStorage.removeItem(PAYPAL_POPUP_FLAG);
        subscriber.next('bloqueado');
        subscriber.complete();
        return;
      }

      const canal = new BroadcastChannel(PAYPAL_CANAL);
      let resuelto = false;

      const resolver = (resultado: ResultadoPaypal) => {
        if (resuelto) {
          return;
        }
        resuelto = true;
        subscriber.next(resultado);
        subscriber.complete();
      };

      canal.onmessage = (evento: MessageEvent<ResultadoPaypal>) => {
        // Cerramos la ventana antes de resolver (el popup ya hizo su trabajo).
        if (!ventana.closed) {
          ventana.close();
        }
        resolver(evento.data);
      };

      // Plan B: si el usuario cierra la ventana sin completar el pago, no llega
      // ningún mensaje; lo tratamos como cancelación.
      const vigilante = window.setInterval(() => {
        if (ventana.closed) {
          resolver('cancelado');
        }
      }, 500);

      return () => {
        localStorage.removeItem(PAYPAL_POPUP_FLAG);
        window.clearInterval(vigilante);
        canal.close();
        if (!ventana.closed) {
          ventana.close();
        }
      };
    });
  }

  /**
   * True si el código corre DENTRO de la ventana emergente de PayPal. Se apoya en
   * la bandera de `localStorage` (resistente a las cabeceras COOP de PayPal, a
   * diferencia de `window.name`/`window.opener`). Las páginas return/cancel lo usan
   * para decidir entre avisar+cerrar (popup) o mostrar la vista completa.
   */
  enVentanaEmergente(): boolean {
    return localStorage.getItem(PAYPAL_POPUP_FLAG) === '1';
  }

  /**
   * Publica el resultado hacia la pestaña que abrió el popup y cierra la ventana.
   * Lo llaman las páginas de retorno/cancelación una vez resuelto el pago. La
   * pestaña original también cierra la ventana al recibir el mensaje, por si el
   * navegador no permite el `window.close()` desde aquí.
   */
  notificarYCerrar(resultado: ResultadoPaypal): void {
    const canal = new BroadcastChannel(PAYPAL_CANAL);
    canal.postMessage(resultado);
    canal.close();
    window.close();
  }

  /** Cadena de `features` para centrar la ventana emergente sobre la actual. */
  private caracteristicas(): string {
    const { ANCHO, ALTO } = PaypalPopupService;
    const left = window.screenX + Math.max(0, (window.outerWidth - ANCHO) / 2);
    const top = window.screenY + Math.max(0, (window.outerHeight - ALTO) / 2);
    return `popup=yes,width=${ANCHO},height=${ALTO},left=${left},top=${top}`;
  }
}

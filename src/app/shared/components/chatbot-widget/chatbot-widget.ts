import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';

import { ChatbotApiService } from '../../../core/services/chatbot-api.service';
import { MensajeChat } from '../../../core/models/chatbot.models';

/**
 * Widget de chatbot (CU-18): boton flotante que abre un panel de conversacion
 * con el asistente virtual. Mantiene el historial en un signal y lo envia al
 * backend para dar contexto. Delega el transporte HTTP en ChatbotApiService
 * (DIP). Si la API falla (p. ej. cuota de Gemini), muestra un mensaje amable en
 * el propio chat en vez de romper la vista.
 */
@Component({
  selector: 'app-chatbot-widget',
  imports: [],
  templateUrl: './chatbot-widget.html',
  styleUrl: './chatbot-widget.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatbotWidget {
  private readonly api = inject(ChatbotApiService);

  readonly abierto = signal(false);
  readonly mensajes = signal<MensajeChat[]>([]);
  readonly borrador = signal('');
  readonly enviando = signal(false);

  /** Preguntas sugeridas para arrancar la conversacion. */
  readonly sugerencias = ['¿Tienen palas?', '¿Qué categorías hay?', '¿Tienen cemento?'];

  /** Contenedor de mensajes, para hacer scroll al final al llegar contenido nuevo. */
  private readonly cuerpo = viewChild<ElementRef<HTMLElement>>('cuerpo');

  constructor() {
    // Auto-scroll al fondo cuando cambian los mensajes o el estado "escribiendo".
    effect(() => {
      this.mensajes();
      this.enviando();
      const el = this.cuerpo()?.nativeElement;
      if (el) {
        requestAnimationFrame(() => (el.scrollTop = el.scrollHeight));
      }
    });
  }

  alternar(): void {
    this.abierto.update((a) => !a);
  }

  cerrar(): void {
    this.abierto.set(false);
  }

  actualizarBorrador(evento: Event): void {
    this.borrador.set((evento.target as HTMLInputElement).value);
  }

  enviar(texto: string): void {
    const mensaje = texto.trim();
    if (!mensaje || this.enviando()) {
      return;
    }

    // El historial que se envia es la conversacion PREVIA (sin el mensaje nuevo).
    const historial = this.mensajes();
    this.mensajes.update((m) => [...m, { rol: 'user', texto: mensaje }]);
    this.borrador.set('');
    this.enviando.set(true);

    this.api.enviar(mensaje, historial).subscribe({
      next: (res) => {
        this.mensajes.update((m) => [...m, { rol: 'assistant', texto: res.respuesta }]);
        this.enviando.set(false);
      },
      error: () => {
        this.mensajes.update((m) => [
          ...m,
          {
            rol: 'assistant',
            texto: 'Disculpá, no pude responder en este momento. Probá de nuevo en un momento.',
          },
        ]);
        this.enviando.set(false);
      },
    });
  }
}

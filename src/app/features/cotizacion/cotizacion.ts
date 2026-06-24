import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { QuoteApiService } from '../../core/services/quote-api.service';
import {
  MAX_ARCHIVOS,
  MAX_TAMANO_BYTES,
  QuoteResponse,
  TIPOS_ARCHIVO_PERMITIDOS,
  TipoIdentificacion,
} from '../../core/models/quote.models';

/**
 * Pagina de solicitud de cotizacion (RF-30/31/32).
 *
 * Formulario reactivo con la misma validacion que el backend (telefono, mensaje
 * minimo, tipos/tamano de archivos). Es publico: no requiere login. Los adjuntos
 * se manejan aparte del FormGroup (son File, no controles de texto).
 */
@Component({
  selector: 'app-cotizacion',
  imports: [ReactiveFormsModule],
  templateUrl: './cotizacion.html',
  styleUrl: './cotizacion.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cotizacion {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(QuoteApiService);

  /** Patron de telefono identico al del backend. */
  private readonly TELEFONO_PATTERN = /^\+?[\d\s\-]{8,15}$/;

  readonly tiposIdentificacion: { valor: TipoIdentificacion; etiqueta: string }[] = [
    { valor: 'cedula', etiqueta: 'Cédula' },
    { valor: 'dimex', etiqueta: 'DIMEX' },
    { valor: 'pasaporte', etiqueta: 'Pasaporte' },
  ];

  readonly form = this.fb.nonNullable.group({
    tipo_identificacion: ['cedula' as TipoIdentificacion, Validators.required],
    numero_identificacion: ['', [Validators.required, Validators.maxLength(50)]],
    nombre: ['', [Validators.required, Validators.maxLength(150)]],
    correo: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.required, Validators.pattern(this.TELEFONO_PATTERN)]],
    asunto: ['Cotización', Validators.maxLength(150)],
    mensaje: ['', [Validators.required, Validators.minLength(10)]],
  });

  // Adjuntos (fuera del FormGroup porque son File).
  readonly archivos = signal<File[]>([]);
  readonly errorArchivos = signal<string | null>(null);

  // Estado del envio.
  readonly enviando = signal(false);
  readonly resultado = signal<QuoteResponse | null>(null);
  readonly errorEnvio = signal<string | null>(null);

  /** Procesa los archivos elegidos validando tipo, tamano y cantidad. */
  onArchivos(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      return;
    }
    const errores: string[] = [];
    const validos: File[] = [];

    for (const archivo of Array.from(input.files)) {
      if (!TIPOS_ARCHIVO_PERMITIDOS.includes(archivo.type as never)) {
        errores.push(`${archivo.name}: solo se permiten PDF, PNG o JPEG`);
        continue;
      }
      if (archivo.size > MAX_TAMANO_BYTES) {
        errores.push(`${archivo.name}: supera los 10 MB`);
        continue;
      }
      validos.push(archivo);
    }

    let combinados = [...this.archivos(), ...validos];
    if (combinados.length > MAX_ARCHIVOS) {
      errores.push(`Máximo ${MAX_ARCHIVOS} archivos por solicitud`);
      combinados = combinados.slice(0, MAX_ARCHIVOS);
    }

    this.archivos.set(combinados);
    this.errorArchivos.set(errores.length ? errores.join(' · ') : null);
    input.value = ''; // permite volver a elegir el mismo archivo
  }

  quitarArchivo(indice: number): void {
    this.archivos.update((lista) => lista.filter((_, i) => i !== indice));
  }

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.errorEnvio.set(null);
    this.resultado.set(null);

    this.api.enviar({ ...this.form.getRawValue(), archivos: this.archivos() }).subscribe({
      next: (res) => {
        this.resultado.set(res);
        this.enviando.set(false);
        this.form.reset({ tipo_identificacion: 'cedula', asunto: 'Cotización' });
        this.archivos.set([]);
      },
      error: (err) => {
        this.errorEnvio.set(this.mensajeError(err));
        this.enviando.set(false);
      },
    });
  }

  private mensajeError(err: unknown): string {
    const detail = (err as { error?: { detail?: unknown } })?.error?.detail;
    if (typeof detail === 'string') {
      return detail;
    }
    return 'No se pudo enviar la solicitud. Verifica tus datos e intenta de nuevo.';
  }
}

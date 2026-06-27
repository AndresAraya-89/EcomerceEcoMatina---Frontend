import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest, TipoIdentificacion } from '../../../core/models/auth.models';
import {
  claveSeguraValidator,
  clavesCoincidenValidator,
  telefonoValidator,
} from '../../../core/validators/auth.validators';

/**
 * Pagina de registro de cliente (CU-06).
 *
 * Formulario reactivo con la misma validacion que el backend (clave fuerte,
 * telefono, tipo de identificacion). No inicia sesion al terminar: la cuenta
 * nace 'no_verificada' y el backend envia un correo de verificacion, asi que
 * mostramos una confirmacion que invita a revisar el buzon.
 */
@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrl: './registro.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Registro {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  readonly tiposIdentificacion: { valor: TipoIdentificacion; etiqueta: string }[] = [
    { valor: 'cedula', etiqueta: 'Cédula' },
    { valor: 'dimex', etiqueta: 'DIMEX' },
    { valor: 'pasaporte', etiqueta: 'Pasaporte' },
  ];

  readonly enviando = this.auth.cargando;
  readonly errorRegistro = signal<string | null>(null);
  /** Correo confirmado tras un registro exitoso (muestra la pantalla de aviso). */
  readonly registrado = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group(
    {
      nombre: ['', [Validators.required, Validators.maxLength(50)]],
      primer_apellido: ['', [Validators.required, Validators.maxLength(50)]],
      segundo_apellido: ['', Validators.maxLength(50)],
      tipo_identificacion: ['cedula' as TipoIdentificacion, Validators.required],
      numero_identificacion: ['', [Validators.required, Validators.maxLength(50)]],
      telefono: ['', [Validators.required, telefonoValidator]],
      correo: ['', [Validators.required, Validators.email]],
      clave: ['', [Validators.required, Validators.maxLength(72), claveSeguraValidator]],
      confirmacion: ['', Validators.required],
    },
    { validators: clavesCoincidenValidator('clave', 'confirmacion') },
  );

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.errorRegistro.set(null);

    const { confirmacion, segundo_apellido, ...resto } = this.form.getRawValue();
    const datos: RegisterRequest = {
      ...resto,
      // El backend espera null (no cadena vacia) cuando no hay segundo apellido.
      segundo_apellido: segundo_apellido.trim() || null,
    };

    this.auth.registrar(datos).subscribe({
      next: () => this.registrado.set(datos.correo),
      error: (err: HttpErrorResponse) => this.errorRegistro.set(this.mensajeError(err)),
    });
  }

  private mensajeError(err: HttpErrorResponse): string {
    const detalle = err.error?.detail;
    if (typeof detalle === 'string') {
      return detalle;
    }
    // 422 de Pydantic: lista de errores por campo.
    if (Array.isArray(detalle) && detalle[0]?.msg) {
      return detalle[0].msg;
    }
    return 'No se pudo completar el registro. Revisa tus datos e intenta de nuevo.';
  }
}

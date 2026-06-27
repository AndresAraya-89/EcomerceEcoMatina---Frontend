import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthApiService } from '../../../core/services/auth-api.service';
import {
  claveSeguraValidator,
  clavesCoincidenValidator,
} from '../../../core/validators/auth.validators';

/** Estado de la pantalla de restablecimiento. */
type Estado = 'formulario' | 'exito' | 'sin-token';

/**
 * Pagina de restablecimiento de contraseña.
 *
 * Es el destino del enlace que llega por correo:
 *   {frontend_url}/restablecer-contrasena?token=...
 * Lee el token del query param, pide la nueva clave (con la misma validacion que
 * el backend) y llama a POST /auth/reset-password. No maneja sesion: al terminar
 * invita a iniciar sesion con la clave nueva.
 *
 * Consume AuthApiService directo (operacion sin estado global, como verificar-cuenta).
 */
@Component({
  selector: 'app-restablecer-contrasena',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './restablecer-contrasena.html',
  styleUrl: './restablecer-contrasena.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestablecerContrasena implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly route = inject(ActivatedRoute);

  readonly estado = signal<Estado>('formulario');
  readonly enviando = signal(false);
  readonly errorReset = signal<string | null>(null);

  private token = '';

  readonly form = this.fb.nonNullable.group(
    {
      clave_nueva: ['', [Validators.required, Validators.maxLength(72), claveSeguraValidator]],
      confirmacion: ['', Validators.required],
    },
    { validators: clavesCoincidenValidator('clave_nueva', 'confirmacion') },
  );

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.estado.set('sin-token');
      return;
    }
    this.token = token;
  }

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.errorReset.set(null);

    const { clave_nueva } = this.form.getRawValue();
    this.authApi.resetearContrasena({ token: this.token, clave_nueva }).subscribe({
      next: () => {
        this.enviando.set(false);
        this.estado.set('exito');
      },
      error: (err: HttpErrorResponse) => {
        this.enviando.set(false);
        this.errorReset.set(this.mensajeError(err));
      },
    });
  }

  private mensajeError(err: HttpErrorResponse): string {
    const detalle = err.error?.detail;
    if (typeof detalle === 'string') {
      return detalle;
    }
    if (Array.isArray(detalle) && detalle[0]?.msg) {
      return detalle[0].msg;
    }
    return 'No se pudo restablecer la contraseña. El enlace puede ser inválido o haber expirado.';
  }
}

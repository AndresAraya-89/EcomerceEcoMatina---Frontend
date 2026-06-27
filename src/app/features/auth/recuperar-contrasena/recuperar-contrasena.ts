import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthApiService } from '../../../core/services/auth-api.service';

/**
 * Pagina "¿Olvidaste tu contraseña?" (CU-10).
 *
 * Solicita el enlace de recuperacion: el usuario escribe su correo y el backend
 * envia el enlace de restablecimiento. Por diseño anti-enumeracion, la respuesta
 * es identica exista o no la cuenta, asi que mostramos el mismo mensaje de exito
 * pase lo que pase (igual que el reenvio de verificacion del login).
 *
 * Consume AuthApiService directo: es una operacion sin estado global (no toca la
 * sesion), como verificar-cuenta.
 */
@Component({
  selector: 'app-recuperar-contrasena',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './recuperar-contrasena.html',
  styleUrl: './recuperar-contrasena.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecuperarContrasena {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);

  readonly enviando = signal(false);
  /** True tras enviar la solicitud: muestra la pantalla de confirmacion. */
  readonly enviado = signal(false);

  readonly form = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.email]],
  });

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);

    const { correo } = this.form.getRawValue();
    this.authApi.solicitarRecuperacion({ correo }).subscribe({
      // Respuesta anti-enumeracion: identica en exito y error.
      next: () => this.marcarEnviado(),
      error: () => this.marcarEnviado(),
    });
  }

  private marcarEnviado(): void {
    this.enviando.set(false);
    this.enviado.set(true);
  }
}

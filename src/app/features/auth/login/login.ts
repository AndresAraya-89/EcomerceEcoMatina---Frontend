import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../../core/services/auth.service';
import { AuthApiService } from '../../../core/services/auth-api.service';

/**
 * Pagina de inicio de sesion (CU-04).
 *
 * Formulario reactivo minimo (correo + clave). Delega toda la logica en el
 * AuthService (Facade): este componente solo recoge datos, navega al exito y
 * muestra el error. Si el backend indica que la cuenta no esta verificada,
 * ofrece reenviar el correo de verificacion sin salir de la pantalla.
 */
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** Estado de envio (deshabilita el boton y muestra el spinner textual). */
  readonly enviando = this.auth.cargando;
  readonly errorLogin = signal<string | null>(null);
  /** True cuando el fallo fue por cuenta sin verificar: habilita el reenvio. */
  readonly cuentaSinVerificar = signal(false);
  readonly verificacionReenviada = signal(false);

  readonly form = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.email]],
    clave: ['', Validators.required],
  });

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.errorLogin.set(null);
    this.cuentaSinVerificar.set(false);
    this.verificacionReenviada.set(false);

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl(this.urlDestino()),
      error: (err: HttpErrorResponse) => this.manejarError(err),
    });
  }

  /** Reenvia el correo de verificacion al correo escrito en el formulario. */
  reenviarVerificacion(): void {
    const correo = this.form.controls.correo.value;
    if (!correo) {
      return;
    }
    this.authApi.reenviarVerificacion({ correo }).subscribe({
      next: () => this.verificacionReenviada.set(true),
      error: () => this.verificacionReenviada.set(true), // respuesta anti-enumeracion: identica
    });
  }

  /** URL a la que volver tras autenticarse (la que pidio el guard) o el inicio. */
  private urlDestino(): string {
    return this.route.snapshot.queryParamMap.get('returnUrl') ?? '/inicio';
  }

  private manejarError(err: HttpErrorResponse): void {
    const detalle = typeof err.error?.detail === 'string' ? err.error.detail : '';
    // El backend distingue la cuenta no verificada con un mensaje propio.
    if (detalle.toLowerCase().includes('verificar')) {
      this.cuentaSinVerificar.set(true);
      this.errorLogin.set(detalle);
      return;
    }
    this.errorLogin.set(
      detalle || 'No se pudo iniciar sesion. Verifica tus datos e intenta de nuevo.',
    );
  }
}

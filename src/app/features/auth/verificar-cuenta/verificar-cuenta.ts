import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthApiService } from '../../../core/services/auth-api.service';

/** Estado de la pantalla de verificacion. */
type Estado = 'verificando' | 'exito' | 'error';

/**
 * Pagina de verificacion de cuenta (CU-07).
 *
 * Es el destino del enlace que llega por correo:
 *   {frontend_url}/verificar-cuenta?token=...
 * Lee el token del query param, llama a POST /auth/verify-account y muestra el
 * resultado. No maneja sesion: solo activa la cuenta para que el usuario pueda
 * iniciar sesion despues.
 */
@Component({
  selector: 'app-verificar-cuenta',
  imports: [RouterLink],
  templateUrl: './verificar-cuenta.html',
  styleUrl: './verificar-cuenta.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerificarCuenta implements OnInit {
  private readonly authApi = inject(AuthApiService);
  private readonly route = inject(ActivatedRoute);

  readonly estado = signal<Estado>('verificando');
  /** Mensaje devuelto por el backend (exito o error). */
  readonly mensaje = signal<string>('');

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.estado.set('error');
      this.mensaje.set('El enlace no es válido: falta el token de verificación.');
      return;
    }

    this.authApi.verificarCuenta({ token }).subscribe({
      next: (res) => {
        this.estado.set('exito');
        this.mensaje.set(res.mensaje);
      },
      error: (err: HttpErrorResponse) => {
        this.estado.set('error');
        this.mensaje.set(this.mensajeError(err));
      },
    });
  }

  private mensajeError(err: HttpErrorResponse): string {
    const detalle = err.error?.detail;
    if (typeof detalle === 'string') {
      return detalle;
    }
    return 'No se pudo verificar la cuenta. El enlace puede ser inválido o haber expirado.';
  }
}

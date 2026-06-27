import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthApiService } from '../../../core/services/auth-api.service';

/** Estado de la pantalla de confirmacion de cambio de correo. */
type Estado = 'confirmando' | 'exito' | 'error';

/**
 * Pagina de confirmacion de cambio de correo.
 *
 * Es el destino del enlace que llega al NUEVO correo tras editar el perfil:
 *   {frontend_url}/confirmar-correo?token=...
 * Lee el token del query param, llama a POST /auth/confirm-email-change y muestra
 * el resultado. No maneja sesion: solo confirma el cambio de correo.
 */
@Component({
  selector: 'app-confirmar-correo',
  imports: [RouterLink],
  templateUrl: './confirmar-correo.html',
  styleUrl: './confirmar-correo.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmarCorreo implements OnInit {
  private readonly authApi = inject(AuthApiService);
  private readonly route = inject(ActivatedRoute);

  readonly estado = signal<Estado>('confirmando');
  /** Mensaje devuelto por el backend (exito o error). */
  readonly mensaje = signal<string>('');

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.estado.set('error');
      this.mensaje.set('El enlace no es válido: falta el token de confirmación.');
      return;
    }

    this.authApi.confirmarCambioCorreo({ token }).subscribe({
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
    return 'No se pudo confirmar el cambio de correo. El enlace puede ser inválido o haber expirado.';
  }
}

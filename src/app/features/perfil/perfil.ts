import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthApiService } from '../../core/services/auth-api.service';
import { AuthService } from '../../core/services/auth.service';
import { Perfil as PerfilModel } from '../../core/models/auth.models';
import {
  claveSeguraValidator,
  clavesCoincidenValidator,
  telefonoValidator,
} from '../../core/validators/auth.validators';

/**
 * Pagina "Mi Perfil" (CU-19). Ruta protegida por authGuard.
 *
 * Dos responsabilidades de UI separadas en dos formularios:
 *   - Datos personales: edita nombre/apellidos/telefono/correo (la identificacion
 *     NO es editable). Si cambia el correo, queda pendiente de confirmacion.
 *   - Contrasena: el backend invalida la sesion al cambiarla, asi que tras el
 *     exito cerramos sesion local y mandamos al login (delegando en AuthService).
 *
 * Consume AuthApiService directo (operaciones sin estado global, como Cotizacion);
 * solo toca el Facade (AuthService) para el cierre de sesion forzado.
 */
@Component({
  selector: 'app-perfil',
  imports: [ReactiveFormsModule, TitleCasePipe],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Perfil {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AuthApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  // ── Carga inicial ─────────────────────────────────────────────────────────
  readonly cargando = signal(true);
  readonly errorCarga = signal<string | null>(null);
  /** Identificacion (solo lectura: no editable por reglas de negocio). */
  readonly identificacion = signal<{ tipo: string; numero: string } | null>(null);

  // ── Datos personales ────────────────────────────────────────────────────
  readonly guardandoDatos = signal(false);
  readonly mensajeDatos = signal<string | null>(null);
  readonly errorDatos = signal<string | null>(null);

  readonly formDatos = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(50)]],
    primer_apellido: ['', [Validators.required, Validators.maxLength(50)]],
    segundo_apellido: ['', Validators.maxLength(50)],
    telefono: ['', [Validators.required, telefonoValidator]],
    correo: ['', [Validators.required, Validators.email]],
  });

  // ── Cambio de contrasena ────────────────────────────────────────────────
  readonly guardandoClave = signal(false);
  readonly errorClave = signal<string | null>(null);

  readonly formClave = this.fb.nonNullable.group(
    {
      clave_actual: ['', Validators.required],
      clave_nueva: ['', [Validators.required, claveSeguraValidator]],
      confirmacion: ['', Validators.required],
    },
    { validators: clavesCoincidenValidator('clave_nueva', 'confirmacion') },
  );

  constructor() {
    this.cargarPerfil();
  }

  /** Carga el perfil del backend y rellena el formulario de datos. */
  private cargarPerfil(): void {
    this.cargando.set(true);
    this.api.obtenerPerfil().subscribe({
      next: (perfil) => this.aplicarPerfil(perfil),
      error: () => {
        this.errorCarga.set('No se pudo cargar tu perfil. Intenta de nuevo.');
        this.cargando.set(false);
      },
    });
  }

  private aplicarPerfil(perfil: PerfilModel): void {
    this.formDatos.patchValue({
      nombre: perfil.nombre,
      primer_apellido: perfil.primer_apellido,
      segundo_apellido: perfil.segundo_apellido ?? '',
      telefono: perfil.telefono,
      correo: perfil.correo,
    });
    this.identificacion.set({
      tipo: perfil.tipo_identificacion,
      numero: perfil.numero_identificacion,
    });
    this.cargando.set(false);
  }

  guardarDatos(): void {
    if (this.formDatos.invalid) {
      this.formDatos.markAllAsTouched();
      return;
    }
    this.guardandoDatos.set(true);
    this.mensajeDatos.set(null);
    this.errorDatos.set(null);

    const { segundo_apellido, ...resto } = this.formDatos.getRawValue();
    this.api
      .actualizarPerfil({ ...resto, segundo_apellido: segundo_apellido.trim() || null })
      .subscribe({
        next: (res) => {
          this.mensajeDatos.set(
            res.correo_pendiente_confirmacion
              ? 'Datos guardados. Revisa tu nuevo correo para confirmar el cambio.'
              : 'Datos actualizados correctamente.',
          );
          this.guardandoDatos.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.errorDatos.set(this.mensajeError(err, 'No se pudieron guardar los datos.'));
          this.guardandoDatos.set(false);
        },
      });
  }

  cambiarContrasena(): void {
    if (this.formClave.invalid) {
      this.formClave.markAllAsTouched();
      return;
    }
    this.guardandoClave.set(true);
    this.errorClave.set(null);

    const { clave_actual, clave_nueva } = this.formClave.getRawValue();
    this.api.cambiarContrasena({ clave_actual, clave_nueva }).subscribe({
      next: () => {
        // El backend invalido la sesion: cerramos local y mandamos al login.
        this.auth.cerrarSesionLocal();
        this.router.navigate(['/auth'], {
          queryParams: { mensaje: 'contrasena-cambiada' },
        });
      },
      error: (err: HttpErrorResponse) => {
        this.errorClave.set(this.mensajeError(err, 'No se pudo cambiar la contraseña.'));
        this.guardandoClave.set(false);
      },
    });
  }

  private mensajeError(err: HttpErrorResponse, fallback: string): string {
    const detalle = err.error?.detail;
    if (typeof detalle === 'string') {
      return detalle;
    }
    if (Array.isArray(detalle) && detalle[0]?.msg) {
      return detalle[0].msg;
    }
    return fallback;
  }
}

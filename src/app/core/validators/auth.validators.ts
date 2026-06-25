import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validadores reutilizables del modulo de seguridad.
 *
 * Replican exactamente las reglas del backend (auth/schemas.py) para que el
 * usuario reciba el error en el formulario antes de enviar y no dependa solo de
 * la respuesta 422. Se centralizan aqui (DRY) porque los reusan registro,
 * cambio de contrasena y restablecimiento.
 */

const PATRON_TELEFONO = /^\+?[\d\s\-]{8,15}$/;

/**
 * Clave segura: minimo 8 caracteres, al menos una mayuscula, una minuscula y un
 * numero. Devuelve `{ claveInsegura: true }` si no cumple (control vacio lo deja
 * pasar; de la obligatoriedad se encarga Validators.required).
 */
export const claveSeguraValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const valor = control.value as string;
  if (!valor) {
    return null;
  }
  const cumple =
    valor.length >= 8 && /[A-Z]/.test(valor) && /[a-z]/.test(valor) && /\d/.test(valor);
  return cumple ? null : { claveInsegura: true };
};

/** Telefono con el mismo patron del backend (8 a 15 digitos, opcional '+'). */
export const telefonoValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const valor = control.value as string;
  if (!valor) {
    return null;
  }
  return PATRON_TELEFONO.test(valor) ? null : { telefonoInvalido: true };
};

/**
 * Validador de grupo: confirma que dos controles de clave coinciden. Marca el
 * error en el grupo (`{ clavesNoCoinciden: true }`), no en un control suelto.
 */
export function clavesCoincidenValidator(
  claveCtrl: string,
  confirmacionCtrl: string,
): ValidatorFn {
  return (grupo: AbstractControl): ValidationErrors | null => {
    const clave = grupo.get(claveCtrl)?.value;
    const confirmacion = grupo.get(confirmacionCtrl)?.value;
    if (!confirmacion) {
      return null;
    }
    return clave === confirmacion ? null : { clavesNoCoinciden: true };
  };
}

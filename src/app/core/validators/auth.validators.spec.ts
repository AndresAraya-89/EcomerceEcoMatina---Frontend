import { FormControl, FormGroup } from '@angular/forms';

import {
  claveSeguraValidator,
  clavesCoincidenValidator,
  telefonoValidator,
} from './auth.validators';

/**
 * Los validadores son funciones puras: el caso de prueba ideal para empezar.
 * Sin TestBed ni dependencias, solo entrada -> salida.
 */
describe('auth.validators', () => {
  describe('claveSeguraValidator', () => {
    it('acepta una clave con mayuscula, minuscula, numero y 8+ caracteres', () => {
      expect(claveSeguraValidator(new FormControl('Abcdef12'))).toBeNull();
    });

    it('rechaza una clave demasiado corta', () => {
      expect(claveSeguraValidator(new FormControl('Abc12'))).toEqual({ claveInsegura: true });
    });

    it('rechaza una clave sin numero', () => {
      expect(claveSeguraValidator(new FormControl('Abcdefgh'))).toEqual({ claveInsegura: true });
    });

    it('rechaza una clave sin mayuscula', () => {
      expect(claveSeguraValidator(new FormControl('abcdef12'))).toEqual({ claveInsegura: true });
    });

    it('deja pasar el control vacio (de required se encarga otro validador)', () => {
      expect(claveSeguraValidator(new FormControl(''))).toBeNull();
    });
  });

  describe('telefonoValidator', () => {
    it('acepta un telefono valido con prefijo +', () => {
      expect(telefonoValidator(new FormControl('+506 8888 8888'))).toBeNull();
    });

    it('rechaza un telefono con letras', () => {
      expect(telefonoValidator(new FormControl('abc12345'))).toEqual({ telefonoInvalido: true });
    });

    it('rechaza un telefono demasiado corto', () => {
      expect(telefonoValidator(new FormControl('123'))).toEqual({ telefonoInvalido: true });
    });

    it('deja pasar el control vacio', () => {
      expect(telefonoValidator(new FormControl(''))).toBeNull();
    });
  });

  describe('clavesCoincidenValidator', () => {
    const construirGrupo = (clave: string, confirmacion: string) =>
      new FormGroup({
        clave_nueva: new FormControl(clave),
        confirmacion: new FormControl(confirmacion),
      });

    const validar = clavesCoincidenValidator('clave_nueva', 'confirmacion');

    it('es valido cuando ambas claves coinciden', () => {
      expect(validar(construirGrupo('Abcdef12', 'Abcdef12'))).toBeNull();
    });

    it('marca error en el grupo cuando no coinciden', () => {
      expect(validar(construirGrupo('Abcdef12', 'Otra1234'))).toEqual({ clavesNoCoinciden: true });
    });

    it('no valida mientras la confirmacion este vacia', () => {
      expect(validar(construirGrupo('Abcdef12', ''))).toBeNull();
    });
  });
});

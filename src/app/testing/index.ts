/**
 * Punto de entrada del modulo de pruebas (`src/app/testing`).
 *
 * Reune utilidades transversales de testing para que los specs importen desde un
 * solo lugar:  import { buildCartItem } from '../../testing';
 *
 * Este modulo NO entra al bundle de produccion: solo lo referencian archivos
 * `*.spec.ts`, que el build de la app excluye (ver tsconfig.app.json) y el de
 * tests incluye (tsconfig.spec.json).
 */
export * from './builders';

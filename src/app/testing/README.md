# Módulo de pruebas (`src/app/testing`)

Utilidades transversales para los tests unitarios. **No entra al bundle de
producción**: solo lo referencian archivos `*.spec.ts`.

## Qué hay aquí

- **`builders.ts`** — _builders_ / _object mothers_: funciones que arman objetos
  de dominio válidos por defecto y aceptan `overrides`. Evitan repetir datos de
  prueba (DRY) y centralizan los cambios de contrato en un solo lugar.

```ts
import { buildCartItem, buildResumen } from '../../testing';

const item = buildCartItem({ cantidad: 3 });        // resto de campos por defecto
const resumen = buildResumen({ total_general: 500 });
```

## Cómo correr los tests

```bash
npm test            # modo watch (abre Chrome, ideal para desarrollar)
npm run test:headless   # una sola corrida, Chrome headless (CI)
npm run test:coverage   # headless + reporte de cobertura en /coverage
```

> `test:headless` y `test:coverage` necesitan un navegador **Chromium**
> (Chrome, Edge u Opera GX). Si no es Chrome en su ruta estándar, hay que
> indicarle a Karma el binario con la variable `CHROME_BIN`. Ejemplo en Windows
> con Opera GX (fijarla una vez, scope Usuario):
>
> ```powershell
> [Environment]::SetEnvironmentVariable('CHROME_BIN', "$env:LocalAppData\Programs\Opera GX\opera.exe", 'User')
> ```
>
> Luego abre una terminal nueva y `npm run test:headless` funciona solo.

## Convención de specs por capa

| Capa | Cómo se prueba | Ejemplo |
|------|----------------|---------|
| Validadores / utils puros | entrada → salida, sin TestBed | `auth.validators.spec.ts` |
| Storage | `sessionStorage`/`localStorage` real, limpiando entre tests | `cart-storage.service.spec.ts` |
| `*ApiService` | `HttpTestingController` (sin red) | `cart-api.service.spec.ts` |
| Facades (`*.service`) | dobles de prueba (`jasmine.SpyObj`) + `of()/throwError()` | `cart.service.spec.ts` |
| Guards | `runInInjectionContext` con `AuthService` falso | `auth.guard.spec.ts` |

## Cobertura actual

- ✅ `auth.validators` · `cart-storage` · `token-storage`
- ✅ `cart-api.service` · `cart.service` (facade) · `auth.guard`
- ✅ `auth.service` (login, logout, refresh dedup, hidratación de `/me`)
- ✅ `auth.interceptor` (Bearer, rutas públicas, reintento ante 401)

## Pendientes sugeridos (continuar la cobertura)

- `product-api.service.spec.ts` — conversión Decimal→number del catálogo.
- `quote-api.service.spec.ts` — envío de cotización con adjuntos (FormData).
- Componentes con formularios (`login`, `cotizacion`, `perfil`) con `HttpTestingController`.

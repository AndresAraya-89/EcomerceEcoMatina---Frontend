# AgroMatina — Frontend

E-commerce de la ferretería **AgroMatina**. Frontend en **Angular 20 + Tailwind CSS v4**
que consume la API de FastAPI (backend `backendagromatina`).

- Dev server: `npm start` → `http://localhost:4200` (o el puerto que indique la CLI).
- Backend (API): `http://localhost:8000`, todos los endpoints bajo `/api/v1`.
- URL base configurable en `src/environments/environment.ts` (`apiUrl`).

## Arquitectura

```
src/app/
  core/                      # Lógica transversal (sin UI)
    models/                  # Interfaces que calzan con los schemas del backend
    services/                # Servicios con responsabilidad única (SOLID)
  features/                  # Páginas / módulos de negocio
  shared/components/         # Componentes reutilizables (header, footer)
```

Buenas prácticas aplicadas: **standalone components**, **signals** (`signal`/`computed`/`effect`),
`inject()`, `ChangeDetectionStrategy.OnPush`, y separación SRP (API ↔ estado ↔ persistencia).

### Estado actual

| Pieza | Estado |
|---|---|
| Base visual (header, footer, home, categorías) | ✅ |
| Carrito conectado a la API (`cart`) | ✅ |
| **Seguridad / Auth (login, registro, verificación, perfil)** | 🚧 En progreso (ver abajo) |
| Resto de módulos | ⏳ Pendiente |

#### 🔐 Módulo de Seguridad — dónde quedó

Estructura (capas SRP: API ↔ estado ↔ persistencia):

```
core/
  models/auth.models.ts          # Interfaces que calzan con los schemas del backend
  services/
    auth.service.ts              # Fachada + store con signals (estaAutenticado, usuario, rol)
    auth-api.service.ts          # Transporte HTTP puro a /api/v1/auth
    token-storage.service.ts     # Persistencia de tokens (access/refresh)
  guards/auth.guard.ts           # Protege rutas (con ?returnUrl=)
  interceptors/auth.interceptor.ts  # Inyecta Bearer + refresca el token ante 401
  validators/auth.validators.ts  # clave segura, teléfono, claves coinciden
features/
  auth/login                     # ✅ Login (CU-04) — maneja cuenta sin verificar (reenvío)
  auth/registro                  # ✅ Registro (CU-06) — form reactivo, valida igual que el backend
  auth/verificar-cuenta          # ✅ Verificación por correo (CU-07) — lee ?token= y activa la cuenta
  perfil                         # 🚧 Perfil (CU-19) — ruta protegida con authGuard
```

Rutas registradas en `app.routes.ts`: `/auth` (login), `/registro`, `/verificar-cuenta`, `/perfil` 🔒.

**Hecho:** login, registro, verificación de cuenta, interceptor JWT + refresh, guard, validadores.

**Pendiente (mismo patrón, falta la vista en el frontend):**
- `/recuperar-contrasena` → consume `POST /auth/reset-password` (enlace que llega por correo).
- `/confirmar-correo` → consume `POST /auth/confirm-email-change` (cambio de correo desde el perfil).
- Terminar la página de **perfil** (`features/perfil`).

> ⚠️ **Config del backend para que lleguen los correos:** en el `.env` del backend, `EMAIL_MODE=smtp`
> (con SMTP_* de Gmail) y `FRONTEND_URL=http://localhost:4200` (los enlaces de los correos apuntan ahí).
> Con `EMAIL_MODE=console` el correo NO se envía, solo se imprimiría en los logs.

---

## 🗺️ Mapa del Backend — API AgroMatina (`/api/v1`)

🔒 = requiere `Authorization: Bearer <token>`

### 1. 🔐 `auth` — Autenticación · `/api/v1/auth`
| Método | Endpoint | Para qué |
|---|---|---|
| POST | `/register` | Registro de cliente + usuario |
| POST | `/login` | Login → access + refresh token (JWT) |
| POST | `/verify-account` | Activar cuenta por correo |
| POST | `/refresh` | Renovar tokens |
| POST | `/logout` 🔒 | Cerrar sesión |
| POST | `/change-password` 🔒 | Cambiar contraseña |
| POST | `/forgot-password` | Solicitar recuperación |
| POST | `/reset-password` | Restablecer con token |
| GET | `/me` 🔒 | Perfil del usuario actual |

Tablas: `clientes`, `usuarios`, `tokens_verificacion`, `cambios_correo`

### 2. 🛒 `product` — Catálogo (público) · `/api/v1`
| Método | Endpoint | Para qué |
|---|---|---|
| GET | `/products/ofertas` | Ofertas del home (máx 8) |
| GET | `/products/mas-vendidos` | Más vendidos del home |
| GET | `/products/search?q=&categoria=&page=` | Búsqueda + filtro + paginación |
| GET | `/categories` | Categorías (menú) |
| GET | `/banners` | Carrusel del home |
| GET | `/categories/{codigo}/products?page=` | Grilla por categoría |
| GET | `/products/{codigo}` | Detalle de producto + galería |

Tablas: `categorias`, `productos`, `producto_imagenes`, `banners`

### 3. 🛍️ `cart` — Carrito · `/api/v1/cart` ✅ *(ya conectado)*
| Método | Endpoint | Para qué |
|---|---|---|
| POST | `/cart/validate-item` | Validar stock/precio al agregar (RF-12) |
| POST | `/cart/summary` | Total seguro recalculado (RF-14) |

### 4. 💳 `pagos` — Proceso de pago · `/api/v1/pagos`
| Método | Endpoint | Para qué |
|---|---|---|
| POST | `/checkout` | Elegir método (SINPE / internacional) |
| POST | `/confirmar` | Confirmar pago + factura PDF + correo |

### 5. 📄 `quote` — Cotizaciones (público) · `/api/v1/quotes`
| Método | Endpoint | Para qué |
|---|---|---|
| POST | `/quotes` | Formulario con adjuntos (multipart, máx 5) → WhatsApp |

Tablas: `solicitudes_cotizacion`, `cotizacion_archivos`

### 6. 🧾 `mis_facturas` — Mis Facturas 🔒 · `/api/v1/mis-facturas`
| Método | Endpoint | Para qué |
|---|---|---|
| GET | `/mis-facturas` | Historial paginado del cliente |
| GET | `/mis-facturas/{numero_orden}` | Detalle (modal) |
| GET | `/mis-facturas/{numero_orden}/pdf` | Descargar PDF |

Tablas: `direccion` (+ pedidos / facturas)

### ⚙️ Módulos que NO consume el navegador
- **`sync`** (`/api/v1/sync`): lo usa la **app de escritorio** (fuente de verdad del catálogo).
  Requiere header `X-API-Key`. **No se toca desde el frontend.**
- **`admin`** y **`client`**: carpetas vacías, no implementadas aún.

> ⚠️ El backend serializa los `Decimal` como **texto** (`"38250.00"`). Convertir a `number`
> en la capa de servicios (ver `core/services/cart-api.service.ts` como referencia).

---

## Orden de desarrollo sugerido

| # | Módulo frontend | Depende de | Notas |
|---|---|---|---|
| 1 | Catálogo (home, grillas, detalle, búsqueda) | `product` (público) | Destraba el botón "Agregar al carrito" |
| 2 | Carrito + botón Agregar | `cart` | Carrito ya hecho; falta el botón en las tarjetas |
| 3 | Auth (login/registro/recuperación) | `auth` | 🚧 Login, registro, verificación, interceptor JWT y guard hechos. Falta recuperación de contraseña, confirmar cambio de correo y terminar perfil |
| 4 | Checkout / Pagos | `pagos` | Cierra el flujo de compra |
| 5 | Mis Facturas 🔒 | `mis_facturas` | Requiere auth (paso 3) |
| 6 | Cotizaciones | `quote` | Formulario público independiente |

---

## Comandos

```bash
npm start      # servidor de desarrollo
npm run build  # build de producción (dist/)
npm test       # pruebas unitarias (Karma)
```

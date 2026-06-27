import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

/**
 * Rutas con carga diferida (`loadComponent`): cada página viaja en su propio
 * chunk y se descarga solo al navegar a ella. Reduce el bundle inicial y mejora
 * el tiempo de arranque. El guard se importa eager porque se evalúa antes de
 * decidir si cargar la página protegida.
 */
export const routes: Routes = [
    // Ruta por defecto: redirige de '' a 'inicio'
    { path: '', redirectTo: 'inicio', pathMatch: 'full' },
    { path: 'inicio', loadComponent: () => import('./features/inicio/inicio').then((m) => m.Inicio) },
    // Pagina generica de catalogo por categoria (data-driven, RF-05)
    {
        path: 'categoria/:codigo',
        loadComponent: () => import('./features/categoria/categoria').then((m) => m.Categoria),
    },
    // Resultados de busqueda (RF-08/09/10) — termino y filtros en la query string
    { path: 'buscar', loadComponent: () => import('./features/buscar/buscar').then((m) => m.Buscar) },
    // Detalle de producto (RF-07)
    {
        path: 'producto/:codigo',
        loadComponent: () => import('./features/producto/producto').then((m) => m.Producto),
    },
    { path: 'cart', loadComponent: () => import('./features/cart/cart').then((m) => m.Cart) },
    // Checkout / pago (protegida: el pedido necesita el cliente autenticado)
    {
        path: 'checkout',
        loadComponent: () => import('./features/checkout/checkout').then((m) => m.Checkout),
        canActivate: [authGuard],
    },
    // Retorno de PayPal: captura el pago aprobado (destino de PAYPAL_RETURN_URL)
    {
        path: 'checkout/paypal/return',
        loadComponent: () =>
            import('./features/checkout/paypal-return/paypal-return').then((m) => m.PaypalReturn),
    },
    // Cancelación de PayPal (destino de PAYPAL_CANCEL_URL)
    {
        path: 'checkout/paypal/cancel',
        loadComponent: () =>
            import('./features/checkout/paypal-cancel/paypal-cancel').then((m) => m.PaypalCancel),
    },
    {
        path: 'cotizacion',
        loadComponent: () => import('./features/cotizacion/cotizacion').then((m) => m.Cotizacion),
    },
    // Seguridad / autenticacion (CU-04 / CU-06)
    { path: 'auth', loadComponent: () => import('./features/auth/login/login').then((m) => m.Login) },
    {
        path: 'registro',
        loadComponent: () => import('./features/auth/registro/registro').then((m) => m.Registro),
    },
    // Verificacion de cuenta (CU-07) — destino del enlace del correo
    {
        path: 'verificar-cuenta',
        loadComponent: () =>
            import('./features/auth/verificar-cuenta/verificar-cuenta').then((m) => m.VerificarCuenta),
    },
    // Mi Perfil (CU-19) — protegida: requiere sesion activa
    {
        path: 'perfil',
        loadComponent: () => import('./features/perfil/perfil').then((m) => m.Perfil),
        canActivate: [authGuard],
    },

    // Cualquier ruta desconocida vuelve al inicio (las antiguas paginas
    // estaticas de categoria fueron reemplazadas por /categoria/:codigo).
    { path: '**', redirectTo: 'inicio' },
];

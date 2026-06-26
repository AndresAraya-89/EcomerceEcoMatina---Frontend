import { Routes } from '@angular/router';
import { Inicio } from './features/inicio/inicio';
import { Cart } from './features/cart/cart';
import { Cotizacion } from './features/cotizacion/cotizacion';
import { Categoria } from './features/categoria/categoria';
import { Producto } from './features/producto/producto';
import { Login } from './features/auth/login/login';
import { Registro } from './features/auth/registro/registro';
import { VerificarCuenta } from './features/auth/verificar-cuenta/verificar-cuenta';
import { Perfil } from './features/perfil/perfil';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    // Ruta por defecto: redirige de '' a 'inicio'
    { path: '', redirectTo: 'inicio', pathMatch: 'full' },
    { path: 'inicio', component: Inicio },
    // Pagina generica de catalogo por categoria (data-driven, RF-05)
    { path: 'categoria/:codigo', component: Categoria },
    // Detalle de producto (RF-07)
    { path: 'producto/:codigo', component: Producto },
    { path: 'cart', component: Cart },
    { path: 'cotizacion', component: Cotizacion },
    // Seguridad / autenticacion (CU-04 / CU-06)
    { path: 'auth', component: Login },
    { path: 'registro', component: Registro },
    // Verificacion de cuenta (CU-07) — destino del enlace del correo
    { path: 'verificar-cuenta', component: VerificarCuenta },
    // Mi Perfil (CU-19) — protegida: requiere sesion activa
    { path: 'perfil', component: Perfil, canActivate: [authGuard] },

    // Cualquier ruta desconocida vuelve al inicio (las antiguas paginas
    // estaticas de categoria fueron reemplazadas por /categoria/:codigo).
    { path: '**', redirectTo: 'inicio' },
];

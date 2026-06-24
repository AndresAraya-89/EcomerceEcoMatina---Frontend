import { Routes } from '@angular/router';
import { Inicio } from './features/inicio/inicio';
import { Riego } from './features/riego/riego';
import { Herramientas } from './features/herramientas/herramientas';
import { Semillas } from './features/semillas/semillas';
import { Maquinaria } from './features/maquinaria/maquinaria';
import { Seguridad } from './features/seguridad/seguridad';
import { Cart } from './features/cart/cart';
import { Cotizacion } from './features/cotizacion/cotizacion';
import { Categoria } from './features/categoria/categoria';

export const routes: Routes = [
    // Ruta por defecto: redirige de '' a 'home'
    { path: '', redirectTo: 'inicio', pathMatch: 'full' },
    { path: 'inicio', component: Inicio },
    // Pagina generica de catalogo por categoria (data-driven, RF-05)
    { path: 'categoria/:codigo', component: Categoria },
    { path: 'riego', component: Riego },
    { path: 'herramientas', component: Herramientas },
    { path: 'semillas', component: Semillas },
    { path: 'maquinaria', component: Maquinaria },
    { path: 'seguridad', component: Seguridad },
    { path: 'cart', component: Cart },
    { path: 'cotizacion', component: Cotizacion },






    // Ruta principal

    // Ruta para manejar errores (404)

];

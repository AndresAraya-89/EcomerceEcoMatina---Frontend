/**
 * Contratos del catalogo (modulo `product` del backend).
 *
 * Espejo de los schemas Pydantic. Endpoints publicos (no requieren login).
 * Los montos se exponen como `number`: el backend los serializa como texto
 * ("38250.00") y el servicio los convierte (ver ProductApiService).
 */

/** Categoria para el menu y filtros (RF-04). */
export interface Categoria {
  codigo: string;
  nombre: string;
}

/** Tarjeta de producto en grillas y resultados (RF-06). */
export interface ProductoCard {
  codigo: string;
  nombre: string;
  precio_actual: number;
  en_oferta: boolean;
  precio_original: number | null;
  porcentaje_descuento: number | null;
  imagen_url: string | null;
}

/** Tarjeta de producto en oferta para el home (RF-01). */
export interface ProductoOferta {
  codigo: string;
  nombre: string;
  precio_original: number;
  precio_oferta: number;
  porcentaje_descuento: number;
  imagen_url: string | null;
}

/** Tarjeta de producto mas vendido para el home (RF-02). */
export interface ProductoMasVendido {
  codigo: string;
  nombre: string;
  precio_actual: number;
  imagen_url: string | null;
}

/** Promocion del carrusel del home (RF-03). */
export interface Banner {
  imagen_url: string;
  texto_descriptivo: string | null;
  url_destino: string | null;
}

/** Imagen de la galeria del detalle (RF-07). */
export interface ImagenProducto {
  url: string;
  es_principal: boolean;
}

/** Detalle completo de un producto (RF-07). */
export interface ProductoDetalle {
  codigo: string;
  nombre: string;
  descripcion: string | null;
  precio_actual: number;
  en_oferta: boolean;
  precio_original: number | null;
  porcentaje_descuento: number | null;
  categoria: Categoria | null;
  imagenes: ImagenProducto[];
}

/** Base de paginacion compartida por grilla y busqueda (RF-11). */
export interface PaginaBase {
  total: number;
  pagina: number;
  tamano_pagina: number;
  total_paginas: number;
  productos: ProductoCard[];
}

/** Grilla paginada de una categoria (RF-05). */
export interface PaginaProductos extends PaginaBase {
  categoria: Categoria;
}

/** Resultados de busqueda paginados (RF-08/09/10). */
export interface ResultadoBusqueda extends PaginaBase {
  consulta: string;
  categoria: string | null;
}

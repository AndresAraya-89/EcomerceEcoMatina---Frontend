/**
 * Configuracion de entorno de la aplicacion.
 *
 * `apiUrl` apunta a la raiz de la API de FastAPI (AgroMatina). Todos los
 * servicios construyen sus rutas a partir de aqui para no repetir el host.
 */
export const environment = {
  production: false,
  // Backend en Render (produccion).
  apiUrl: 'https://ecomerceecomatina-backend.onrender.com/api/v1',
  // Backend local (uvicorn/FastAPI por defecto en el puerto 8000) — descomentar para pruebas locales.
  // apiUrl: 'http://localhost:8000/api/v1',
};

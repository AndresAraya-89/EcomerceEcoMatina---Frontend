/**
 * Configuracion de entorno de la aplicacion.
 *
 * `apiUrl` apunta a la raiz de la API de FastAPI (AgroMatina). Todos los
 * servicios construyen sus rutas a partir de aqui para no repetir el host.
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api/v1',
};

import {
  ApplicationConfig,
  DEFAULT_CURRENCY_CODE,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeEsCR from '@angular/common/locales/es-CR';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

// Datos de formato de Costa Rica (separadores, fechas, símbolo ₡). Debe
// registrarse antes del bootstrap para que CurrencyPipe/DatePipe/DecimalPipe
// usen es-CR. El id ('es-CR') viene incluido en los datos del locale.
registerLocaleData(localeEsCR);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Formato regional Costa Rica y moneda por defecto (colón).
    { provide: LOCALE_ID, useValue: 'es-CR' },
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'CRC' },
    // anchorScrolling: permite que `fragment` (hero → #ofertas/#categorias) haga
    // scroll a la sección; scrollPositionRestoration restaura el scroll al navegar.
    provideRouter(
      routes,
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
    ),
    provideHttpClient(withInterceptors([authInterceptor])),
  ]
};

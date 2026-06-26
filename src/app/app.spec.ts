import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { App } from './app';

/**
 * Smoke test del shell. Solo verifica que el componente raiz se construye con sus
 * dependencias resueltas (router + HttpClient que usan header/footer). No se
 * dispara change detection para no instanciar los hijos ni sus peticiones HTTP:
 * eso se cubre en los specs de cada componente.
 */
describe('App (shell)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('se crea correctamente', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });
});

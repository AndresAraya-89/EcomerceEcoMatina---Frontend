import { TestBed } from '@angular/core/testing';

import { TokenStorageService } from './token-storage.service';
import { buildTokenResponse } from '../../testing';

/** Persistencia de tokens en localStorage (sobrevive al cierre de pestana). */
describe('TokenStorageService', () => {
  let service: TokenStorageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(TokenStorageService);
  });

  afterEach(() => localStorage.clear());

  it('sin tokens: accessToken/refreshToken son null y no hay sesion', () => {
    expect(service.accessToken()).toBeNull();
    expect(service.refreshToken()).toBeNull();
    expect(service.tieneSesion()).toBeFalse();
  });

  it('guardar() persiste ambos tokens y marca sesion activa', () => {
    service.guardar(buildTokenResponse({ access_token: 'A', refresh_token: 'R' }));
    expect(service.accessToken()).toBe('A');
    expect(service.refreshToken()).toBe('R');
    expect(service.tieneSesion()).toBeTrue();
  });

  it('limpiar() borra ambos tokens', () => {
    service.guardar(buildTokenResponse());
    service.limpiar();
    expect(service.tieneSesion()).toBeFalse();
  });
});

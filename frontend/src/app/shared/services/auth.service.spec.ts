import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

function buildJwt(payload: object): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload)).replace(/=/g, '');
  return `${header}.${body}.signature`;
}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), AuthService],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('login()', () => {
    it('stores token in localStorage on successful login', () => {
      service.login({ username: 'admin', password: 'admin' }).subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush({ token: 'test.token.value' });
      expect(localStorage.getItem('token')).toBe('test.token.value');
    });

    it('returns the TokenResponse to the caller', () => {
      let received: any;
      service.login({ username: 'admin', password: 'admin' }).subscribe(r => (received = r));
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush({ token: 'test.token.value' });
      expect(received).toEqual({ token: 'test.token.value' });
    });
  });

  describe('logout()', () => {
    it('removes token from localStorage', () => {
      localStorage.setItem('token', 'some-token');
      service.logout();
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('isAuthenticated()', () => {
    it('returns false when no token in localStorage', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('returns true for a valid non-expired JWT', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const jwt = buildJwt({ sub: 'admin', exp: futureExp });
      localStorage.setItem('token', jwt);
      expect(service.isAuthenticated()).toBe(true);
    });

    it('returns false for an expired JWT', () => {
      const pastExp = Math.floor(Date.now() / 1000) - 60;
      const jwt = buildJwt({ sub: 'admin', exp: pastExp });
      localStorage.setItem('token', jwt);
      expect(service.isAuthenticated()).toBe(false);
    });

    it('returns false for a malformed token', () => {
      localStorage.setItem('token', 'not.a.jwt');
      expect(service.isAuthenticated()).toBe(false);
    });

    it('returns false for a token with only one segment', () => {
      localStorage.setItem('token', 'onlyone');
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('getToken()', () => {
    it('returns null when no token stored', () => {
      expect(service.getToken()).toBeNull();
    });

    it('returns the stored token', () => {
      localStorage.setItem('token', 'my-token');
      expect(service.getToken()).toBe('my-token');
    });
  });
});

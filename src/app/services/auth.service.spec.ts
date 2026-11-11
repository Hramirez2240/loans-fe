import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthInterceptor } from './auth.interceptor';
import { API_URL, AuthService, AuthSession } from './auth.service';

describe('AuthService', () => {
  let auth: AuthService;
  let httpClient: HttpClient;
  let http: HttpTestingController;

  const session: AuthSession = {
    accessToken: 'signed-token',
    tokenType: 'Bearer',
    expiresAt: '2099-01-01T00:00:00Z',
    user: { id: 'user-1', email: 'maria@example.com', fullName: 'María Gómez', role: 'USER' }
  };

  beforeEach(() => {
    sessionStorage.removeItem('loans-auth-session');
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }]
    });
    auth = TestBed.inject(AuthService);
    httpClient = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    auth.logout();
  });

  it('stores the returned session and sends its JWT on protected API requests', () => {
    auth.login({ email: session.user.email, password: 'secure-password' }).subscribe();
    const login = http.expectOne(`${API_URL}/auth/login`);
    expect(login.request.method).toBe('POST');
    login.flush(session);
    expect(auth.currentUser).toEqual(session.user);

    httpClient.get(`${API_URL}/loans`).subscribe();
    const loans = http.expectOne(`${API_URL}/loans`);
    expect(loans.request.headers.get('Authorization')).toBe('Bearer signed-token');
    loans.flush([]);
  });

  it('registers accounts through the public authentication endpoint', () => {
    const details = {
      fullName: 'María Gómez',
      email: 'maria@example.com',
      password: 'secure-password'
    };
    auth.register(details).subscribe();
    const request = http.expectOne(`${API_URL}/auth/register`);

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(details);
    request.flush(session);
    expect(auth.currentUser).toEqual(session.user);
  });
});

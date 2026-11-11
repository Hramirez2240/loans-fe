import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthGuard, AdminGuard } from './auth.guard';
import { AuthService, AuthUser } from './services/auth.service';

describe('Authentication guards', () => {
  let router: Router;
  let auth: { isAuthenticated: boolean; currentUser: AuthUser | null };
  let authGuard: AuthGuard;
  let adminGuard: AdminGuard;

  beforeEach(() => {
    auth = { isAuthenticated: false, currentUser: null };
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [{ provide: AuthService, useValue: auth }]
    });
    router = TestBed.inject(Router);
    authGuard = new AuthGuard(TestBed.inject(AuthService), router);
    adminGuard = new AdminGuard(TestBed.inject(AuthService), router);
  });

  it('redirects unauthenticated users to login', () => {
    const result = authGuard.canActivate();

    expect(result instanceof UrlTree).toBeTrue();
    if (result instanceof UrlTree) expect(router.serializeUrl(result)).toBe('/login');
  });

  it('allows only administrators through the administrator guard', () => {
    auth.isAuthenticated = true;
    auth.currentUser = { id: 'user-1', email: 'user@example.com', fullName: 'Usuario', role: 'USER' };
    const userResult = adminGuard.canActivate();
    expect(userResult instanceof UrlTree).toBeTrue();
    if (userResult instanceof UrlTree) expect(router.serializeUrl(userResult)).toBe('/app');

    auth.currentUser = { id: 'admin-1', email: 'admin@example.com', fullName: 'Admin', role: 'ADMIN' };
    expect(adminGuard.canActivate()).toBeTrue();
  });
});

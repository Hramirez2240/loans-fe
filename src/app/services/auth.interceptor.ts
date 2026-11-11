import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, throwError } from 'rxjs';
import { API_URL, AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService, private router: Router) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = request.url.startsWith(API_URL) ? this.auth.token : null;
    const authorizedRequest = token
      ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : request;

    return next.handle(authorizedRequest).pipe(
      catchError((error: unknown) => {
        const isProtectedApiRequest = request.url.startsWith(`${API_URL}/`)
          && !request.url.startsWith(`${API_URL}/auth/`);
        if (error instanceof HttpErrorResponse && error.status === 401 && isProtectedApiRequest) {
          this.auth.logout();
          void this.router.navigate(['/login'], { queryParams: { expired: 'true' } });
        }
        return throwError(() => error);
      })
    );
  }
}

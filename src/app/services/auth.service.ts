import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';

export const API_URL = 'http://localhost:8080/api';

export type UserRole = 'USER' | 'ADMIN';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface AuthSession {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
  user: AuthUser;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  fullName: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'loans-auth-session';
  private session: AuthSession | null = this.readSession();

  constructor(private http: HttpClient) {}

  get currentUser(): AuthUser | null {
    return this.currentSession?.user ?? null;
  }

  get token(): string | null {
    return this.currentSession?.accessToken ?? null;
  }

  get isAuthenticated(): boolean {
    return this.currentSession !== null;
  }

  login(credentials: LoginRequest): Observable<AuthSession> {
    this.logout();
    return this.http.post<AuthSession>(`${API_URL}/auth/login`, credentials).pipe(
      tap(session => this.saveSession(session))
    );
  }

  register(details: RegisterRequest): Observable<AuthSession> {
    this.logout();
    return this.http.post<AuthSession>(`${API_URL}/auth/register`, details).pipe(
      tap(session => this.saveSession(session))
    );
  }

  logout(): void {
    this.session = null;
    sessionStorage.removeItem(this.storageKey);
  }

  private get currentSession(): AuthSession | null {
    if (this.session && Date.parse(this.session.expiresAt) <= Date.now()) {
      this.logout();
    }
    return this.session;
  }

  private saveSession(session: AuthSession): void {
    this.session = session;
    sessionStorage.setItem(this.storageKey, JSON.stringify(session));
  }

  private readSession(): AuthSession | null {
    const stored = sessionStorage.getItem(this.storageKey);
    if (!stored) return null;

    let session: unknown;
    try {
      session = JSON.parse(stored);
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
      sessionStorage.removeItem(this.storageKey);
      return null;
    }

    if (!this.isAuthSession(session) || Date.parse(session.expiresAt) <= Date.now()) {
      sessionStorage.removeItem(this.storageKey);
      return null;
    }
    return session;
  }

  private isAuthSession(value: unknown): value is AuthSession {
    if (typeof value !== 'object' || value === null) return false;
    const session = value as Partial<AuthSession>;
    const user = session.user as Partial<AuthUser> | undefined;
    return typeof session.accessToken === 'string'
      && typeof session.tokenType === 'string'
      && typeof session.expiresAt === 'string'
      && Number.isFinite(Date.parse(session.expiresAt))
      && typeof user?.id === 'string'
      && typeof user.email === 'string'
      && typeof user.fullName === 'string'
      && (user.role === 'USER' || user.role === 'ADMIN');
  }
}

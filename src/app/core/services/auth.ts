import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, map, shareReplay, finalize } from 'rxjs';
import { API, KEYCLOAK } from '../config/api.config';

const TOKEN_KEY = 'nurtricenter_access_token';
const REFRESH_KEY = 'nurtricenter_refresh_token';
const USER_KEY = 'nurtricenter_user';

function decodeJwtPayload(token: string): Record<string, unknown> {
  const part = token.split('.')[1] ?? '';
  const b64 = part.replaceAll('-', '+').replaceAll('_', '/');
  const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '=');
  return JSON.parse(atob(padded));
}

export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
}

export interface UserInfo {
  username: string;
  email?: string;
  roles?: string[];
  name?: string;
}

@Injectable({ providedIn: 'root' })
export class Auth {
  private refreshInFlight: Observable<string> | null = null;

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router
  ) {}

  login(username: string, password: string): Observable<LoginResponse> {
    const body = new HttpParams()
      .set('grant_type', 'password')
      .set('client_id', KEYCLOAK.clientId)
      .set('username', username)
      .set('password', password);
    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });

    return this.http.post<LoginResponse>(API.auth.login, body.toString(), { headers }).pipe(
      tap((res) => {
        localStorage.setItem(TOKEN_KEY, res.access_token);
        if (res.refresh_token) {
          localStorage.setItem(REFRESH_KEY, res.refresh_token);
        }
        try {
          const payload = decodeJwtPayload(res.access_token) as {
            preferred_username?: string;
            email?: string;
            name?: string;
            given_name?: string;
            realm_access?: { roles?: string[] };
          };
          const user: UserInfo = {
            username: payload.preferred_username ?? username,
            email: payload.email,
            name: payload.name ?? payload.given_name,
            roles: payload.realm_access?.roles ?? [],
          };
          localStorage.setItem(USER_KEY, JSON.stringify(user));
        } catch {
          localStorage.setItem(USER_KEY, JSON.stringify({ username }));
        }
      }),
      catchError((err) => {
        const desc = err.error?.error_description ?? err.error?.error;
        const msg = desc ?? err.message ?? 'No fue posible iniciar sesión';
        return throwError(() => new Error(msg));
      })
    );
  }

  refresh(): Observable<string> {
    if (this.refreshInFlight) return this.refreshInFlight;
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) return throwError(() => new Error('No refresh token'));

    const body = new HttpParams()
      .set('grant_type', 'refresh_token')
      .set('client_id', KEYCLOAK.clientId)
      .set('refresh_token', refreshToken);
    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });

    this.refreshInFlight = this.http
      .post<LoginResponse>(API.auth.refresh, body.toString(), { headers })
      .pipe(
        tap((res) => {
          localStorage.setItem(TOKEN_KEY, res.access_token);
          if (res.refresh_token) localStorage.setItem(REFRESH_KEY, res.refresh_token);
        }),
        map((res) => res.access_token),
        shareReplay(1),
        finalize(() => (this.refreshInFlight = null))
      );
    return this.refreshInFlight;
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    this.router.navigateByUrl('/login');
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return false;
    try {
      const payload = decodeJwtPayload(token) as { exp?: number };
      return !!payload.exp && payload.exp * 1000 > Date.now();
    } catch {
      return !!token;
    }
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getCurrentUser(): UserInfo | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserInfo;
    } catch {
      return null;
    }
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.roles?.includes(role) ?? false;
  }
}

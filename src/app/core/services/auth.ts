import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { API } from '../config/api.config';

const TOKEN_KEY = 'nurtricenter_access_token';
const REFRESH_KEY = 'nurtricenter_refresh_token';
const USER_KEY = 'nurtricenter_user';

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
  constructor(
    private readonly http: HttpClient,
    private readonly router: Router
  ) {}

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(API.auth.login, { username, password }).pipe(
      tap((res) => {
        localStorage.setItem(TOKEN_KEY, res.access_token);
        if (res.refresh_token) {
          localStorage.setItem(REFRESH_KEY, res.refresh_token);
        }
        try {
          const payload = JSON.parse(atob(res.access_token.split('.')[1]));
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
        const msg =
          err.error?.message ?? err.error?.error_description ?? 'Credenciales incorrectas';
        return throwError(() => new Error(msg));
      })
    );
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
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
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

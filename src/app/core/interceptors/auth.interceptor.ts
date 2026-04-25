import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { catchError, retry, switchMap, throwError, timer } from 'rxjs';
import { Auth } from '../services/auth';
import { API } from '../config/api.config';

const AUTH_URLS = [API.auth.login, API.auth.refresh];

function isAuthUrl(url: string): boolean {
  return AUTH_URLS.some((u) => url.startsWith(u));
}

function correlationId(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c?.randomUUID) return c.randomUUID();
  if (c?.getRandomValues) {
    const b = new Uint8Array(16);
    c.getRandomValues(b);
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const h = Array.from(b, (n) => n.toString(16).padStart(2, '0'));
    return `${h.slice(0, 4).join('')}-${h.slice(4, 6).join('')}-${h.slice(6, 8).join('')}-${h.slice(8, 10).join('')}-${h.slice(10, 16).join('')}`;
  }
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
}

function withAuth<T>(req: HttpRequest<T>, token: string): HttpRequest<T> {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
      'X-Correlation-Id': correlationId(),
    },
  });
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const isAuth = isAuthUrl(req.url);
  const token = auth.getToken();
  const initial = !isAuth && token ? withAuth(req, token) : req;

  const BACKOFF_MS = [250, 500, 1000];

  return next(initial).pipe(
    retry({
      count: 3,
      delay: (err: HttpErrorResponse, attempt: number) => {
        if (err.status !== 502 && err.status !== 503) throw err;
        return timer(BACKOFF_MS[attempt - 1] ?? 1000);
      },
    }),
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401 || isAuth) return throwError(() => err);
      return auth.refresh().pipe(
        catchError((refreshErr) => {
          auth.logout();
          return throwError(() => refreshErr);
        }),
        switchMap((newToken) => next(withAuth(req, newToken)))
      );
    })
  );
};

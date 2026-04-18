import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { Auth } from '../services/auth';
import { API } from '../config/api.config';

const AUTH_URLS = [API.auth.login, API.auth.refresh];

function isAuthUrl(url: string): boolean {
  return AUTH_URLS.some((u) => url.startsWith(u));
}

function withAuth<T>(req: HttpRequest<T>, token: string): HttpRequest<T> {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
      'X-Correlation-Id': crypto.randomUUID(),
    },
  });
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const isAuth = isAuthUrl(req.url);
  const token = auth.getToken();
  const initial = !isAuth && token ? withAuth(req, token) : req;

  return next(initial).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401 || isAuth) return throwError(() => err);
      return auth.refresh().pipe(
        switchMap((newToken) => next(withAuth(req, newToken))),
        catchError((refreshErr) => {
          auth.logout();
          return throwError(() => refreshErr);
        })
      );
    })
  );
};

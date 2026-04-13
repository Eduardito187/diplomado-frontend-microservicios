import { HttpInterceptorFn } from '@angular/common/http';

const TOKEN_KEY = 'nurtricenter_access_token';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'X-Correlation-Id': crypto.randomUUID(),
      },
    });
    return next(authReq);
  }

  return next(req);
};

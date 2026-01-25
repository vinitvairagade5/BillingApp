import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const userJson = localStorage.getItem('billpro_user');
  if (userJson) {
    const authData = JSON.parse(userJson);
    if (authData.token) {
      const cloned = req.clone({
        setHeaders: {
          Authorization: `Bearer ${authData.token}`
        }
      });
      return next(cloned);
    }
  }
  return next(req);
};

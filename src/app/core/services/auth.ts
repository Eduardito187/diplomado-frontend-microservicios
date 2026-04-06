import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly tokenKey = 'microfront_auth_token';

  login(email: string, password: string): boolean {
    if (!email || !password) {
      return false;
    }

    const fakeToken = btoa(`${email}:${new Date().toISOString()}`);
    localStorage.setItem(this.tokenKey, fakeToken);
    return true;
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }
}

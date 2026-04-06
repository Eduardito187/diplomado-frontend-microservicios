import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../core/services/auth';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  errorMessage = '';
  readonly loginForm;

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: Auth,
    private readonly router: Router
  ) {
    this.loginForm = this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]],
    });
  }

  submit(): void {
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.errorMessage = 'Completa correctamente los campos.';
      return;
    }

    const { email, password } = this.loginForm.getRawValue();
    const logged = this.auth.login(email, password);

    if (!logged) {
      this.errorMessage = 'No fue posible iniciar sesion.';
      return;
    }

    this.router.navigateByUrl('/home');
  }

}

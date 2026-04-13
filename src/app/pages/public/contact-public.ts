import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-contact-public',
  imports: [ReactiveFormsModule],
  template: `
    <section class="page-hero">
      <div class="container">
        <span class="eyebrow">Contáctanos</span>
        <h1>Hablemos sobre tu plan ideal</h1>
        <p>Cuéntanos tus objetivos y una nutricionista se pondrá en contacto contigo.</p>
      </div>
    </section>

    <section class="section">
      <div class="container contact-grid">
        <form class="contact-form" [formGroup]="form" (ngSubmit)="submit()">
          @if (sent()) {
            <div class="sent-banner">
              <i class="bi bi-check-circle-fill"></i>
              ¡Gracias! Recibimos tu mensaje y te contactaremos pronto.
            </div>
          }

          <div class="form-row">
            <div>
              <label for="name">Nombre completo</label>
              <input id="name" type="text" formControlName="name" placeholder="Ej. María Pérez" />
            </div>
            <div>
              <label for="phone">Teléfono</label>
              <input id="phone" type="tel" formControlName="phone" placeholder="+51 999 999 999" />
            </div>
          </div>

          <label for="email">Correo electrónico</label>
          <input id="email" type="email" formControlName="email" placeholder="tu@correo.com" />

          <label for="plan">Plan de interés</label>
          <select id="plan" formControlName="plan">
            <option value="">Selecciona un plan</option>
            <option value="saludable">Plan Saludable</option>
            <option value="pro">Plan Pro</option>
            <option value="clinico">Plan Clínico</option>
            <option value="consulta">Solo consulta</option>
          </select>

          <label for="message">Mensaje</label>
          <textarea id="message" formControlName="message" placeholder="Cuéntanos tus objetivos..."></textarea>

          <button type="submit" [disabled]="form.invalid">
            <i class="bi bi-send me-2"></i>
            Enviar mensaje
          </button>
        </form>

        <aside class="contact-info">
          <div class="info-card">
            <div class="icon"><i class="bi bi-geo-alt"></i></div>
            <div>
              <h4>Dirección</h4>
              <p>Av. Principal 123, San Isidro<br />Lima, Perú</p>
            </div>
          </div>

          <div class="info-card">
            <div class="icon"><i class="bi bi-telephone"></i></div>
            <div>
              <h4>Teléfono</h4>
              <a href="tel:+51999888777">+51 999 888 777</a>
            </div>
          </div>

          <div class="info-card">
            <div class="icon"><i class="bi bi-envelope"></i></div>
            <div>
              <h4>Correo</h4>
              <a href="mailto:hola@nurtricenter.com">hola&#64;nurtricenter.com</a>
            </div>
          </div>

          <div class="info-card">
            <div class="icon"><i class="bi bi-clock"></i></div>
            <div>
              <h4>Horario</h4>
              <p>Lun - Vie: 8:00 a 19:00<br />Sáb: 9:00 a 14:00</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  `,
  styleUrl: './public-pages.scss',
})
export class ContactPublic {
  private readonly fb = inject(FormBuilder);
  readonly sent = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    phone: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    plan: [''],
    message: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.sent.set(true);
    this.form.reset({ name: '', phone: '', email: '', plan: '', message: '' });
  }
}

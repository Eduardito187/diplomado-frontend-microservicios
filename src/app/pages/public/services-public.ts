import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Plan {
  name: string;
  price: string;
  period: string;
  description: string;
  highlight?: boolean;
  features: string[];
}

@Component({
  selector: 'app-services-public',
  imports: [RouterLink],
  template: `
    <section class="page-hero">
      <div class="container">
        <span class="eyebrow">Nuestros servicios</span>
        <h1>Planes diseñados para cada objetivo</h1>
        <p>Desde un plan básico hasta uno 100% personalizado con supervisión médica.</p>
      </div>
    </section>

    <section class="section">
      <div class="container plans-grid">
        @for (p of plans; track p.name) {
          <article class="plan-card" [class.highlight]="p.highlight">
            @if (p.highlight) { <span class="plan-tag">Más popular</span> }
            <h3>{{ p.name }}</h3>
            <p class="plan-desc">{{ p.description }}</p>
            <div class="plan-price">
              <strong>{{ p.price }}</strong>
              <span>{{ p.period }}</span>
            </div>
            <ul>
              @for (f of p.features; track f) {
                <li><i class="bi bi-check-circle-fill"></i> {{ f }}</li>
              }
            </ul>
            <a routerLink="/contacto" class="plan-cta">Quiero este plan</a>
          </article>
        }
      </div>
    </section>

    <section class="section extra">
      <div class="container">
        <h2>Servicios adicionales</h2>
        <div class="extra-grid">
          @for (x of extras; track x.title) {
            <div class="extra-card">
              <i class="bi {{ x.icon }}"></i>
              <h3>{{ x.title }}</h3>
              <p>{{ x.text }}</p>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styleUrl: './public-pages.scss',
})
export class ServicesPublic {
  readonly plans: Plan[] = [
    {
      name: 'Plan Saludable',
      price: 'S/ 299',
      period: '/ semana',
      description: 'Ideal para empezar a comer mejor sin complicaciones.',
      features: [
        '3 comidas al día',
        '6 días a la semana',
        'Balance macro estándar',
        'Entrega en Lima Metropolitana',
      ],
    },
    {
      name: 'Plan Pro',
      price: 'S/ 459',
      period: '/ semana',
      highlight: true,
      description: 'Para quienes buscan resultados concretos con soporte profesional.',
      features: [
        '4 comidas + snack',
        '7 días a la semana',
        'Macros personalizados',
        'Consulta semanal incluida',
        'Ajustes de plan ilimitados',
      ],
    },
    {
      name: 'Plan Clínico',
      price: 'S/ 589',
      period: '/ semana',
      description: 'Diseñado para condiciones que requieren supervisión médica.',
      features: [
        'Para diabetes, hipertensión, etc.',
        'Supervisión clínica',
        'Mediciones mensuales',
        'Reportes de progreso',
      ],
    },
  ];

  readonly extras = [
    {
      icon: 'bi-person-video3',
      title: 'Consulta online',
      text: 'Agenda una videoconsulta con nuestras nutricionistas desde cualquier lugar.',
    },
    {
      icon: 'bi-journal-text',
      title: 'Recetario personalizado',
      text: 'Libro digital con recetas adaptadas a tus preferencias y restricciones.',
    },
    {
      icon: 'bi-graph-up',
      title: 'Seguimiento avanzado',
      text: 'Mediciones quincenales y reportes detallados de composición corporal.',
    },
  ];
}

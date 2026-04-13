import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-presentation',
  imports: [RouterLink],
  templateUrl: './presentation.html',
  styleUrl: './presentation.scss',
})
export class Presentation {
  readonly features = [
    {
      icon: 'bi-person-heart',
      title: 'Atención personalizada',
      text: 'Nutricionistas colegiadas diseñan un plan según tus objetivos, medidas y estilo de vida.',
    },
    {
      icon: 'bi-basket3',
      title: 'Planes entregados a tu puerta',
      text: 'Recibe tus comidas preparadas, con calorías y macros calculados. Sin pensar en qué cocinar.',
    },
    {
      icon: 'bi-activity',
      title: 'Seguimiento continuo',
      text: 'Tu nutricionista ajusta el plan cada semana en base a tus avances y preferencias.',
    },
    {
      icon: 'bi-shield-check',
      title: 'Ingredientes certificados',
      text: 'Trabajamos con proveedores locales y recetas validadas por nuestro equipo clínico.',
    },
  ];

  readonly plans = [
    {
      name: 'Plan Saludable',
      price: 'S/ 299',
      period: '/ semana',
      highlight: false,
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
      highlight: false,
      features: [
        'Para condiciones específicas',
        'Supervisión médica',
        'Mediciones mensuales',
        'Reportes de progreso',
      ],
    },
  ];

  readonly steps = [
    { n: 1, title: 'Agenda tu cita', text: 'Reserva una evaluación inicial con nuestras nutricionistas.' },
    { n: 2, title: 'Recibe tu plan', text: 'Diseñamos un plan alimentario a tu medida con porciones y recetas.' },
    { n: 3, title: 'Disfruta tus comidas', text: 'Entregamos tus comidas preparadas en ventanas de tiempo que elijas.' },
    { n: 4, title: 'Avanza con soporte', text: 'Hacemos seguimiento y ajustamos tu plan cada semana.' },
  ];
}

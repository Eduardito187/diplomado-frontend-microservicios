import { Component } from '@angular/core';

@Component({
  selector: 'app-team-public',
  template: `
    <section class="page-hero">
      <div class="container">
        <span class="eyebrow">Nuestro equipo</span>
        <h1>Nutricionistas que cambian vidas</h1>
        <p>Profesionales colegiados con experiencia en nutrición clínica, deportiva y pediátrica.</p>
      </div>
    </section>

    <section class="section">
      <div class="container team-grid">
        @for (n of team; track n.name) {
          <article class="team-card">
            <div class="avatar">{{ n.initials }}</div>
            <h3>{{ n.name }}</h3>
            <div class="role">{{ n.role }}</div>
            <p class="bio">{{ n.bio }}</p>
          </article>
        }
      </div>
    </section>
  `,
  styleUrl: './public-pages.scss',
})
export class TeamPublic {
  readonly team = [
    {
      initials: 'AM',
      name: 'Ana Mendoza',
      role: 'Nutrición Clínica',
      bio: '10 años de experiencia en manejo nutricional de pacientes con diabetes y enfermedades metabólicas.',
    },
    {
      initials: 'CR',
      name: 'Carlos Ruiz',
      role: 'Nutrición Deportiva',
      bio: 'Especialista en planes para deportistas de alto rendimiento y personas activas.',
    },
    {
      initials: 'LS',
      name: 'Lucía Salazar',
      role: 'Nutrición Pediátrica',
      bio: 'Enfocada en alimentación saludable desde la infancia y adolescencia.',
    },
    {
      initials: 'JT',
      name: 'Jorge Torres',
      role: 'Nutrición Oncológica',
      bio: 'Apoyo nutricional durante y después de tratamientos oncológicos.',
    },
    {
      initials: 'PV',
      name: 'Paola Vega',
      role: 'Nutrición Bariátrica',
      bio: 'Acompañamiento pre y post cirugía bariátrica con planes personalizados.',
    },
    {
      initials: 'RG',
      name: 'Ricardo Gómez',
      role: 'Nutrición Comunitaria',
      bio: 'Programas corporativos y de educación nutricional para empresas.',
    },
  ];
}

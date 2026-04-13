import { Component } from '@angular/core';

@Component({
  selector: 'app-about-public',
  template: `
    <section class="page-hero">
      <div class="container">
        <span class="eyebrow">Quiénes somos</span>
        <h1>Nutrición profesional al alcance de todos</h1>
        <p>Un equipo multidisciplinario dedicado a hacer de la buena alimentación una realidad diaria.</p>
      </div>
    </section>

    <section class="section">
      <div class="container about-grid">
        <div class="about-text">
          <span class="eyebrow">Nuestra misión</span>
          <h2>Transformamos la forma en que las personas se alimentan</h2>
          <p>
            NurTriCenter nace con el propósito de combinar la ciencia de la nutrición con la
            comodidad de la entrega a domicilio. Creemos que comer bien no debería ser complicado,
            costoso ni aburrido.
          </p>
          <p>
            Trabajamos con nutricionistas colegiadas, proveedores locales certificados y tecnología
            propia para asegurar que cada plato cumpla con los más altos estándares clínicos y de sabor.
          </p>
          <ul>
            <li><i class="bi bi-check-circle-fill"></i> Profesionales colegiados</li>
            <li><i class="bi bi-check-circle-fill"></i> Recetas validadas clínicamente</li>
            <li><i class="bi bi-check-circle-fill"></i> Ingredientes frescos y locales</li>
            <li><i class="bi bi-check-circle-fill"></i> Seguimiento personalizado</li>
          </ul>
        </div>
        <div class="about-image">
          <i class="bi bi-heart-pulse"></i>
        </div>
      </div>

      <div class="container">
        <div class="stats-row">
          <div class="stat-box"><strong>1,500+</strong><span>Pacientes atendidos</span></div>
          <div class="stat-box"><strong>15</strong><span>Nutricionistas</span></div>
          <div class="stat-box"><strong>50k+</strong><span>Comidas entregadas</span></div>
          <div class="stat-box"><strong>98%</strong><span>Satisfacción</span></div>
        </div>
      </div>
    </section>
  `,
  styleUrl: './public-pages.scss',
})
export class AboutPublic {}

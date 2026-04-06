import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../core/services/auth';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  readonly cards = [
    {
      title: 'Autenticacion',
      icon: 'bi-shield-check',
      description: 'Gestion de usuarios, sesion y roles.'
    },
    {
      title: 'Catalogo',
      icon: 'bi-box-seam',
      description: 'Productos, categorias e inventario.'
    },
    {
      title: 'Ordenes',
      icon: 'bi-receipt',
      description: 'Carrito, checkout y estado de compra.'
    },
    {
      title: 'Notificaciones',
      icon: 'bi-bell',
      description: 'Eventos por correo, push y alertas internas.'
    },
    {
      title: 'Reportes',
      icon: 'bi-graph-up-arrow',
      description: 'Metricas clave y vistas de analitica.'
    }
  ];

  constructor(
    private readonly auth: Auth,
    private readonly router: Router
  ) { }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

}

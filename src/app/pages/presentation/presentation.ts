import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-presentation',
  imports: [RouterLink],
  templateUrl: './presentation.html',
  styleUrl: './presentation.scss',
})
export class Presentation {
  readonly microservices = [
    'Autenticacion y perfiles',
    'Catalogo de productos',
    'Ordenes y pagos',
    'Notificaciones',
    'Reportes y analitica'
  ];
}

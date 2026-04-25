import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API } from '../config/api.config';
import {
  Producto,
  CreateProductoDto,
  Paquete,
  Suscripcion,
  Calendario,
  GenerarOrdenDto,
} from '../models/production.model';

export interface LaravelResource {
  id: string;
  [k: string]: unknown;
}

export type ProductionResourceKey =
  | 'productos'
  | 'paquetes'
  | 'recetas'
  | 'suscripciones'
  | 'calendarios'
  | 'calendarioItems'
  | 'etiquetas'
  | 'porciones'
  | 'ventanasEntrega';

@Injectable({ providedIn: 'root' })
export class ProductionService {
  private readonly http = inject(HttpClient);

  generarOrden(dto: GenerarOrdenDto): Observable<{ ordenProduccionId: string }> {
    return this.http.post<{ ordenProduccionId: string }>(API.production.ordenes.generar, dto);
  }

  planificarOrden(body: unknown): Observable<unknown> {
    return this.http.post(API.production.ordenes.planificar, body);
  }

  procesarOrden(body: unknown): Observable<unknown> {
    return this.http.post(API.production.ordenes.procesar, body);
  }

  despacharOrden(body: unknown): Observable<unknown> {
    return this.http.post(API.production.ordenes.despachar, body);
  }

  list<T = LaravelResource>(key: ProductionResourceKey): Observable<T[]> {
    return this.http.get<T[]>(API.production[key].base);
  }

  get<T = LaravelResource>(key: ProductionResourceKey, id: string): Observable<T> {
    return this.http.get<T>(API.production[key].byId(id));
  }

  create<T = unknown, B = unknown>(key: ProductionResourceKey, body: B): Observable<T> {
    return this.http.post<T>(API.production[key].base, body);
  }

  update<T = unknown, B = unknown>(
    key: ProductionResourceKey,
    id: string,
    body: B,
  ): Observable<T> {
    return this.http.put<T>(API.production[key].byId(id), body);
  }

  remove(key: ProductionResourceKey, id: string): Observable<unknown> {
    return this.http.delete(API.production[key].byId(id));
  }

  getProductos(): Observable<Producto[]> {
    return this.list<Producto>('productos');
  }

  getProductoById(id: string): Observable<Producto> {
    return this.get<Producto>('productos', id);
  }

  createProducto(dto: CreateProductoDto): Observable<{ productId: string }> {
    return this.create<{ productId: string }, CreateProductoDto>('productos', dto);
  }

  updateProducto(id: string, dto: Partial<CreateProductoDto>): Observable<unknown> {
    return this.update('productos', id, dto);
  }

  deleteProducto(id: string): Observable<unknown> {
    return this.remove('productos', id);
  }

  getPaquetes(): Observable<Paquete[]> {
    return this.list<Paquete>('paquetes');
  }

  getSuscripciones(): Observable<Suscripcion[]> {
    return this.list<Suscripcion>('suscripciones');
  }

  getCalendarios(): Observable<Calendario[]> {
    return this.list<Calendario>('calendarios');
  }

  getSuscripcionCalendarios(id: string): Observable<Calendario[]> {
    return this.http.get<Calendario[]>(API.production.suscripciones.calendarios(id));
  }

  getPacienteCalendarios(id: string): Observable<Calendario[]> {
    return this.http.get<Calendario[]>(API.production.pacientes.calendarios(id));
  }

  getPacienteVentanasEntrega(id: string): Observable<unknown[]> {
    return this.http.get<unknown[]>(API.production.pacientes.ventanasEntrega(id));
  }

  getCalendarioPacientes(id: string): Observable<unknown[]> {
    return this.http.get<unknown[]>(API.production.calendarios.pacientes(id));
  }

  getCalendarioVentanasEntrega(id: string): Observable<unknown[]> {
    return this.http.get<unknown[]>(API.production.calendarios.ventanasEntrega(id));
  }

  getVentanaEntregaPacientes(id: string): Observable<unknown[]> {
    return this.http.get<unknown[]>(API.production.ventanasEntrega.pacientes(id));
  }

  getVentanaEntregaCalendarios(id: string): Observable<Calendario[]> {
    return this.http.get<Calendario[]>(API.production.ventanasEntrega.calendarios(id));
  }

}

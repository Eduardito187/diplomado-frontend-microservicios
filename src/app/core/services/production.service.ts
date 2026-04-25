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
  AgendaResponse,
  OrdenConsolidada,
  SuscripcionOrdenes,
} from '../models/production.model';

export interface LaravelResource {
  id: string;
  [k: string]: unknown;
}

export type ProductionResourceKey =
  | 'productos'
  | 'paquetes'
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
    return this.http.get<Suscripcion[]>(API.production.suscripciones.base);
  }

  getCalendarios(): Observable<Calendario[]> {
    return this.http.get<Calendario[]>(API.production.calendarios.base);
  }

  getPacientes(): Observable<LaravelResource[]> {
    return this.http.get<LaravelResource[]>(API.production.pacientes.base);
  }

  getPacienteById(id: string): Observable<LaravelResource> {
    return this.http.get<LaravelResource>(API.patients.byId(id));
  }

  getPacienteDireccionById(pacienteId: string, direccionId: string): Observable<LaravelResource> {
    return this.http.get<LaravelResource>(API.patients.addressById(pacienteId, direccionId));
  }

  getVentanaEntregaById(id: string): Observable<LaravelResource> {
    return this.http.get<LaravelResource>(API.production.ventanasEntrega.byId(id));
  }

  getPacienteAddresses(pacienteId: string): Observable<unknown[]> {
    return this.http.get<unknown[]>(API.patients.addresses(pacienteId));
  }

  getOrdenItems(ordenId: string): Observable<unknown[]> {
    return this.http.get<unknown[]>(API.production.ordenes.items(ordenId));
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

  getProximaVentana(): Observable<{ id: string; desde: string; hasta: string; estado: number; entrega_id: string; contrato_id: string }> {
    return this.http.get<{ id: string; desde: string; hasta: string; estado: number; entrega_id: string; contrato_id: string }>(
      API.production.ventanasEntrega.proxima
    );
  }

  getAgenda(fechaInicio?: string, fechaFin?: string): Observable<AgendaResponse> {
    let url = API.production.agenda;
    const params: string[] = [];
    if (fechaInicio) params.push(`fecha_inicio=${fechaInicio}`);
    if (fechaFin) params.push(`fecha_fin=${fechaFin}`);
    if (params.length) url += `?${params.join('&')}`;
    return this.http.get<AgendaResponse>(url);
  }

  getOrdenesConsolidadas(): Observable<OrdenConsolidada[]> {
    return this.http.get<OrdenConsolidada[]>(API.production.ordenesConsolidadas);
  }

  getOrdenConsolidada(id: string): Observable<OrdenConsolidada> {
    return this.http.get<OrdenConsolidada>(API.production.ordenConsolidada(id));
  }

  getSuscripcionOrdenes(id: string): Observable<SuscripcionOrdenes> {
    return this.http.get<SuscripcionOrdenes>(API.production.suscripcionOrdenes(id));
  }

}

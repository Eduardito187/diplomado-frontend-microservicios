import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { API } from '../config/api.config';
import {
  ActualizarSuscripcionDto,
  CrearSuscripcionDto,
  CrearSuscripcionEnvelope,
  Suscripcion,
  SuscripcionEnvelope,
} from '../models/suscripcion.model';

@Injectable({
  providedIn: 'root',
})
export class SuscripcionesService {
  private readonly http = inject(HttpClient);

  getSuscripciones(): Observable<Suscripcion[]> {
    return this.http
      .get(API.suscripciones.base, { responseType: 'text' })
      .pipe(map((raw) => this.unwrapSuscripciones(this.parseEnvelope(raw))));
  }

  createSuscripcion(dto: CrearSuscripcionDto): Observable<string> {
    return this.http
      .post(API.suscripciones.base, dto, { responseType: 'text' })
      .pipe(map((raw) => this.unwrapCreateResponse(this.parseCreateEnvelope(raw))));
  }

  updateSuscripcion(id: string, dto: ActualizarSuscripcionDto): Observable<void> {
    const url = `${API.suscripciones.base}/${encodeURIComponent(id)}`;
    return this.http.put(url, dto).pipe(map(() => undefined));
  }

  private parseEnvelope(raw: string): SuscripcionEnvelope {
    const clean = (raw ?? '').trim().replace(/^\uFEFF/, '');
    if (!clean) {
      throw new Error('La respuesta del endpoint llego vacia.');
    }
    if (/^<!doctype html/i.test(clean) || /^<html/i.test(clean)) {
      throw new Error(
        'La respuesta no viene del API de suscripciones (llego HTML). Reinicia el servidor Angular para activar proxy.',
      );
    }

    try {
      const parsed = JSON.parse(clean) as Record<string, unknown>;
      return {
        value: (parsed['value'] ?? parsed['Value'] ?? []) as Suscripcion[],
        isSuccess: Boolean(parsed['isSuccess'] ?? parsed['IsSuccess']),
        isFailure: Boolean(parsed['isFailure'] ?? parsed['IsFailure']),
        error: (parsed['error'] ?? parsed['Error'] ?? null) as SuscripcionEnvelope['error'],
      };
    } catch {
      throw new Error('La respuesta del endpoint no es JSON valido.');
    }
  }

  private parseCreateEnvelope(raw: string): CrearSuscripcionEnvelope {
    const clean = (raw ?? '').trim().replace(/^\uFEFF/, '');
    if (!clean) {
      throw new Error('La respuesta de creacion llego vacia.');
    }
    if (/^<!doctype html/i.test(clean) || /^<html/i.test(clean)) {
      throw new Error(
        'La respuesta no viene del API de suscripciones (llego HTML). Reinicia el servidor Angular para activar proxy.',
      );
    }

    try {
      const parsed = JSON.parse(clean) as Record<string, unknown>;
      return {
        value: String(parsed['value'] ?? parsed['Value'] ?? ''),
        isSuccess: Boolean(parsed['isSuccess'] ?? parsed['IsSuccess']),
        isFailure: Boolean(parsed['isFailure'] ?? parsed['IsFailure']),
        error: (parsed['error'] ?? parsed['Error'] ?? null) as CrearSuscripcionEnvelope['error'],
      };
    } catch {
      throw new Error('La respuesta de creacion no es JSON valido.');
    }
  }

  private unwrapSuscripciones(env: SuscripcionEnvelope): Suscripcion[] {
    if (!env || env.isSuccess === false || env.isFailure === true) {
      throw new Error(env?.error?.description ?? 'No se pudo obtener suscripciones.');
    }
    return env.value ?? [];
  }

  private unwrapCreateResponse(env: CrearSuscripcionEnvelope): string {
    if (!env || env.isSuccess === false || env.isFailure === true) {
      throw new Error(env?.error?.description ?? 'No se pudo crear la suscripcion.');
    }
    if (!env.value) {
      throw new Error('El API no devolvio el id de la suscripcion creada.');
    }
    return env.value;
  }
}

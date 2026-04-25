import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { API } from '../config/api.config';
import {
  Contrato,
  ContratoEnvelope,
  EntregaCalendario,
  EntregaCalendarioEnvelope,
  ActualizarCalendarioEntregaDto,
} from '../models/contrato.model';

@Injectable({
  providedIn: 'root',
})
export class ContratosSuscripcionesService {
  private readonly http = inject(HttpClient);

  getContratos(): Observable<Contrato[]> {
    return this.http
      .get(API.contratosSuscripciones.base, { responseType: 'text' })
      .pipe(map((raw) => this.unwrapContratos(this.parseEnvelope(raw))));
  }

  getCalendarioEntregas(contratoId: string): Observable<EntregaCalendario[]> {
    const url = `${API.contratosSuscripciones.calendarioEntrega}?contratoId=${encodeURIComponent(contratoId)}`;
    return this.http
      .get(url, { responseType: 'text' })
      .pipe(map((raw) => this.unwrapEntregas(this.parseEntregaEnvelope(raw))));
  }

  private parseEnvelope(raw: string): ContratoEnvelope {
    const clean = (raw ?? '').trim().replace(/^\uFEFF/, '');
    if (!clean) {
      throw new Error('La respuesta del endpoint llego vacia.');
    }
    if (/^<!doctype html/i.test(clean) || /^<html/i.test(clean)) {
      throw new Error(
        'La respuesta no viene del API de contratos (llego HTML). Reinicia el servidor Angular para activar proxy.',
      );
    }
    try {
      const parsed = JSON.parse(clean) as Record<string, unknown>;
      return {
        value: (parsed['value'] ?? parsed['Value'] ?? []) as Contrato[],
        isSuccess: Boolean(parsed['isSuccess'] ?? parsed['IsSuccess']),
        isFailure: Boolean(parsed['isFailure'] ?? parsed['IsFailure']),
        error: (parsed['error'] ?? parsed['Error'] ?? null) as ContratoEnvelope['error'],
      };
    } catch {
      throw new Error('La respuesta del endpoint no es JSON valido.');
    }
  }

  private unwrapContratos(env: ContratoEnvelope): Contrato[] {
    if (!env || env.isSuccess === false || env.isFailure === true) {
      throw new Error(env?.error?.description ?? 'No se pudo obtener contratos.');
    }
    return env.value ?? [];
  }

  private parseEntregaEnvelope(raw: string): EntregaCalendarioEnvelope {
    const clean = (raw ?? '').trim().replace(/^\uFEFF/, '');
    if (!clean) {
      throw new Error('La respuesta de calendario llego vacia.');
    }
    if (/^<!doctype html/i.test(clean) || /^<html/i.test(clean)) {
      throw new Error(
        'La respuesta no viene del API de calendario (llego HTML). Reinicia el servidor Angular para activar proxy.',
      );
    }
    try {
      const parsed = JSON.parse(clean) as Record<string, unknown>;
      return {
        value: (parsed['value'] ?? parsed['Value'] ?? []) as EntregaCalendario[],
        isSuccess: Boolean(parsed['isSuccess'] ?? parsed['IsSuccess']),
        isFailure: Boolean(parsed['isFailure'] ?? parsed['IsFailure']),
        error: (parsed['error'] ?? parsed['Error'] ?? null) as EntregaCalendarioEnvelope['error'],
      };
    } catch {
      throw new Error('La respuesta de calendario no es JSON valido.');
    }
  }

  private unwrapEntregas(env: EntregaCalendarioEnvelope): EntregaCalendario[] {
    if (!env || env.isSuccess === false || env.isFailure === true) {
      throw new Error(env?.error?.description ?? 'No se pudo obtener entregas del calendario.');
    }
    return env.value ?? [];
  }

  actualizarCalendarioEntrega(entregaId: string, dto: ActualizarCalendarioEntregaDto): Observable<void> {
    const url = `${API.contratosSuscripciones.calendarioEntrega}/${encodeURIComponent(entregaId)}`;
    return this.http
      .put(url, dto)
      .pipe(map(() => undefined));
  }

  cancelarContrato(contratoId: string): Observable<void> {
    const url = `${API.contratosSuscripciones.base}/${encodeURIComponent(contratoId)}/cancelar`;
    return this.http
      .post(url, {})
      .pipe(map(() => undefined));
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API, ResultEnvelope } from '../config/api.config';
import {
  Patient,
  CreatePatientDto,
  UpdatePatientDto,
  Address,
  CreateAddressDto,
} from '../models/patient.model';

function unwrap<T>(): (env: ResultEnvelope<T>) => T {
  return (env) => {
    if (!env || env.success === false) {
      throw new Error(env?.error?.message ?? 'Request failed');
    }
    return env.value as T;
  };
}

function isoToDdMmYyyy(iso?: string): string | undefined {
  if (!iso) return undefined;
  const d = iso.slice(0, 10).split('-');
  if (d.length !== 3) return iso;
  return `${d[2]}-${d[1]}-${d[0]}`;
}

@Injectable({ providedIn: 'root' })
export class PatientService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Patient[]> {
    return this.http
      .get<ResultEnvelope<Patient[]>>(API.patients.base)
      .pipe(map(unwrap<Patient[]>()));
  }

  getById(id: string): Observable<Patient> {
    return this.http
      .get<ResultEnvelope<Patient>>(API.patients.byId(id))
      .pipe(map(unwrap<Patient>()));
  }

  create(dto: CreatePatientDto): Observable<string> {
    const body = { ...dto, birthDate: isoToDdMmYyyy(dto.birthDate) };
    return this.http
      .post<ResultEnvelope<string>>(API.patients.base, body)
      .pipe(map(unwrap<string>()));
  }

  update(id: string, dto: UpdatePatientDto): Observable<void> {
    const body = { ...dto, birthDate: isoToDdMmYyyy(dto.birthDate) };
    return this.http
      .put<ResultEnvelope<void>>(API.patients.byId(id), body)
      .pipe(map(() => undefined));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(API.patients.byId(id));
  }

  getAddresses(patientId: string): Observable<Address[]> {
    return this.http
      .get<ResultEnvelope<Address[]>>(API.patients.addresses(patientId))
      .pipe(map(unwrap<Address[]>()));
  }

  addAddress(patientId: string, dto: CreateAddressDto): Observable<string> {
    return this.http
      .post<ResultEnvelope<string>>(API.patients.addresses(patientId), dto)
      .pipe(map(unwrap<string>()));
  }

  updateAddress(
    patientId: string,
    addressId: string,
    dto: CreateAddressDto
  ): Observable<void> {
    return this.http
      .put<ResultEnvelope<void>>(API.patients.addressById(patientId, addressId), dto)
      .pipe(map(() => undefined));
  }

  deleteAddress(patientId: string, addressId: string): Observable<void> {
    return this.http.delete<void>(API.patients.addressById(patientId, addressId));
  }

  geocodeAddress(
    patientId: string,
    addressId: string,
    latitude: number,
    longitude: number
  ): Observable<void> {
    return this.http
      .put<ResultEnvelope<void>>(API.patients.addressGeo(patientId, addressId), {
        latitude,
        longitude,
      })
      .pipe(map(() => undefined));
  }
}

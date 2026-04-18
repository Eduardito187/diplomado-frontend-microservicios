import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API, ResultEnvelope } from '../config/api.config';
import {
  ScheduledAppointment,
  Nutritionist,
  ScheduleAppointmentDto,
  CreateNutritionistDto,
  UpdateNutritionistDto,
  AttendAppointmentDto,
} from '../models/appointment.model';

function unwrap<T>(env: ResultEnvelope<T>): T {
  if (!env || env.success === false) {
    throw new Error(env?.error?.message ?? 'Request failed');
  }
  return env.value as T;
}

function isoToDdMmYyyyHms(iso: string): string {
  const [datePart, timePart = '00:00:00'] = iso.split('T');
  const [y, m, d] = datePart.split('-');
  const time = timePart.slice(0, 8);
  const withSeconds = time.length === 5 ? `${time}:00` : time;
  return `${d}-${m}-${y} ${withSeconds}`;
}

function isoToDdMmYyyy(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}-${m}-${y}`;
}

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly http = inject(HttpClient);

  schedule(dto: ScheduleAppointmentDto): Observable<string> {
    const body = { ...dto, scheduleDate: isoToDdMmYyyyHms(dto.scheduleDate) };
    return this.http
      .post<ResultEnvelope<string>>(API.appointments.schedule, body)
      .pipe(map(unwrap<string>));
  }

  attend(dto: AttendAppointmentDto): Observable<boolean> {
    return this.http
      .post<ResultEnvelope<boolean>>(API.appointments.attend, dto)
      .pipe(map(unwrap<boolean>));
  }

  cancel(id: string): Observable<boolean> {
    return this.http
      .patch<ResultEnvelope<boolean>>(API.appointments.cancel, { id })
      .pipe(map(unwrap<boolean>));
  }

  notAttended(id: string): Observable<boolean> {
    return this.http
      .patch<ResultEnvelope<boolean>>(API.appointments.notAttended, { id })
      .pipe(map(unwrap<boolean>));
  }

  getNutritionists(): Observable<Nutritionist[]> {
    return this.http
      .get<ResultEnvelope<Nutritionist[]>>(API.nutritionists.base)
      .pipe(map(unwrap<Nutritionist[]>));
  }

  createNutritionist(dto: CreateNutritionistDto): Observable<string> {
    return this.http
      .post<ResultEnvelope<string>>(API.nutritionists.base, dto)
      .pipe(map(unwrap<string>));
  }

  updateNutritionist(dto: UpdateNutritionistDto): Observable<boolean> {
    return this.http
      .put<ResultEnvelope<boolean>>(API.nutritionists.base, dto)
      .pipe(map(unwrap<boolean>));
  }

  deleteNutritionist(id: string): Observable<boolean> {
    return this.http
      .request<ResultEnvelope<boolean>>('delete', API.nutritionists.base, { body: { id } })
      .pipe(map(unwrap<boolean>));
  }

  getAppointmentsByNutritionistAndDate(
    nutritionistId: string,
    isoDate: string
  ): Observable<ScheduledAppointment[]> {
    return this.http
      .post<ResultEnvelope<ScheduledAppointment[]>>(API.nutritionists.appointmentsByDate, {
        nutritionistId,
        date: isoToDdMmYyyy(isoDate),
      })
      .pipe(map(unwrap<ScheduledAppointment[]>));
  }
}

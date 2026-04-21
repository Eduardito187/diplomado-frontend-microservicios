import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { retry } from 'rxjs/operators';
import { API } from '../config/api.config';
import {
  PackageDto,
  PackageActionDto,
  SetDeliveryOrderDto,
  MarkDeliveryCompletedDto,
  RegisterDeliveryIncidentDto,
  IncidentType,
} from '../models/logistics.model';

@Injectable({ providedIn: 'root' })
export class LogisticsService {
  private readonly http = inject(HttpClient);

  private withRetry<T>(source: Observable<T>): Observable<T> {
    return source.pipe(
      retry({
        count: 1,
        delay: (err, retryCount) => {
          const status = (err as { status?: number })?.status ?? 0;
          if ((status >= 500 || status === 0) && retryCount <= 1) {
            return timer(500);
          }
          return throwError(() => err);
        },
      })
    );
  }

  getPackage(packageId: string): Observable<PackageDto> {
    const params = new HttpParams().set('packageId', packageId);
    return this.withRetry(this.http.get<PackageDto>(API.logistics.getPackage, { params }));
  }

  getPackagesByDriverAndDate(driverId: string, deliveryDate: string): Observable<PackageDto[]> {
    const params = new HttpParams().set('driverId', driverId).set('deliveryDate', deliveryDate);
    return this.withRetry(
      this.http.get<PackageDto[]>(API.logistics.getPackagesByDriverAndDate, { params })
    );
  }

  setDeliveryOrder(packageId: string, deliveryOrder: number): Observable<boolean> {
    const body: SetDeliveryOrderDto = { packageId, deliveryOrder };
    return this.withRetry(this.http.post<boolean>(API.logistics.setDeliveryOrder, body));
  }

  cancelDelivery(packageId: string): Observable<boolean> {
    const body: PackageActionDto = { packageId };
    return this.withRetry(this.http.post<boolean>(API.logistics.cancelDelivery, body));
  }

  markDeliveryFailed(packageId: string): Observable<boolean> {
    const body: PackageActionDto = { packageId };
    return this.withRetry(this.http.post<boolean>(API.logistics.markDeliveryFailed, body));
  }

  markDeliveryInTransit(packageId: string): Observable<boolean> {
    const body: PackageActionDto = { packageId };
    return this.withRetry(this.http.post<boolean>(API.logistics.markDeliveryInTransit, body));
  }

  markDeliveryCompleted(packageId: string, deliveryEvidence: string): Observable<boolean> {
    const body: MarkDeliveryCompletedDto = { packageId, deliveryEvidence };
    return this.withRetry(this.http.post<boolean>(API.logistics.markDeliveryCompleted, body));
  }

  registerDeliveryIncident(
    packageId: string,
    incidentType: IncidentType,
    incidentDescription: string,
  ): Observable<boolean> {
    const body: RegisterDeliveryIncidentDto = { packageId, incidentType, incidentDescription };
    return this.withRetry(this.http.post<boolean>(API.logistics.registerDeliveryIncident, body));
  }
}

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, forkJoin, of } from 'rxjs';
import { Auth } from '../../core/services/auth';
import { LogisticsService } from '../../core/services/logistics.service';
import { ToastService } from '../../core/services/toast.service';
import { SECTION_ROLES } from '../../core/config/roles';
import { ensureRole } from '../../core/utils/role-check';
import { IncidentType, PackageDto } from '../../core/models/logistics.model';
import { BadgeStatus } from '../../shared/components/badge-status/badge-status';
import { EmptyState } from '../../shared/components/empty-state/empty-state';

function toLocalYyyyMmDd(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

@Component({
  selector: 'app-logistics',
  imports: [ReactiveFormsModule, BadgeStatus, EmptyState],
  templateUrl: './logistics.html',
  styleUrl: './logistics.scss',
})
export class Logistics implements OnInit {
  private readonly logisticsSvc = inject(LogisticsService);
  private readonly auth = inject(Auth);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly loading = signal<boolean>(true);
  readonly savingOrders = signal<boolean>(false);
  readonly selectedDate = signal<string>(toLocalYyyyMmDd(new Date()));
  readonly driverId = signal<string | null>(null);
  readonly packages = signal<PackageDto[]>([]);

  readonly orderDrafts = signal<Record<string, number | null>>({});
  readonly evidenceByPackage = signal<Record<string, string>>({});
  readonly incidentTypeByPackage = signal<Record<string, IncidentType>>({});
  readonly incidentDescriptionByPackage = signal<Record<string, string>>({});
  readonly rowBusy = signal<Record<string, boolean>>({});

  readonly hasOrderChanges = computed(() => {
    const drafts = this.orderDrafts();
    return this.packages().some((p) => {
      if (p.deliveryStatus !== 'Pending') return false;
      const draft = drafts[p.id];
      if (draft === undefined || draft === null) return false;
      return draft !== (p.deliveryOrder ?? null);
    });
  });

  readonly canSaveOrders = computed(() => this.hasOrderChanges() && !this.savingOrders());

  ngOnInit(): void {
    if (!ensureRole(SECTION_ROLES.logistics, this.auth, this.router)) return;
    const driver = this.auth.getDriverId();
    this.driverId.set(driver);
    if (!driver) {
      this.loading.set(false);
      this.toast.error('No se pudo obtener el identificador del driver desde el token.');
      return;
    }
    this.loadPackages();
  }

  onDateChange(date: string): void {
    this.selectedDate.set(date);
    this.loadPackages();
  }

  refresh(): void {
    this.loadPackages();
  }

  onOrderChange(packageId: string, value: string): void {
    const parsed = Number(value);
    this.orderDrafts.update((drafts) => ({
      ...drafts,
      [packageId]: Number.isFinite(parsed) ? parsed : null,
    }));
  }

  saveDeliveryOrder(): void {
    if (!this.hasOrderChanges()) {
      this.toast.info('No hay cambios de orden para guardar.');
      return;
    }

    const updates = this.packages()
      .filter((p) => p.deliveryStatus === 'Pending')
      .map((p) => {
        const draft = this.orderDrafts()[p.id];
        if (draft === undefined || draft === null || draft === p.deliveryOrder) return null;
        if (draft <= 0) {
          this.toast.error(`El orden del paquete ${p.number} debe ser mayor a 0.`);
          return null;
        }
        return this.logisticsSvc.setDeliveryOrder(p.id, draft);
      })
      .filter((req): req is ReturnType<LogisticsService['setDeliveryOrder']> => !!req);

    if (updates.length === 0) {
      return;
    }

    this.savingOrders.set(true);
    forkJoin(updates)
      .pipe(finalize(() => this.savingOrders.set(false)))
      .subscribe({
        next: () => {
          this.toast.success('Orden de entrega actualizada.');
          this.loadPackages();
        },
        error: (err) => this.toast.error(this.extractError(err)),
      });
  }

  saveOrderForPackage(pkg: PackageDto): void {
    if (pkg.deliveryStatus !== 'Pending') return;
    const draft = this.orderDrafts()[pkg.id];
    if (draft === undefined || draft === null || draft === pkg.deliveryOrder) {
      this.toast.info('Este paquete no tiene cambios de orden.');
      return;
    }
    if (draft <= 0) {
      this.toast.error(`El orden del paquete ${pkg.number} debe ser mayor a 0.`);
      return;
    }

    this.runRowAction(
      pkg.id,
      this.logisticsSvc.setDeliveryOrder(pkg.id, draft),
      `Orden actualizada para ${pkg.number}.`,
    );
  }

  markInTransit(pkg: PackageDto): void {
    if (pkg.deliveryStatus !== 'Pending') return;
    if ((this.orderDrafts()[pkg.id] ?? pkg.deliveryOrder ?? 0) <= 0) {
      this.toast.warning('Define y guarda el orden antes de iniciar tránsito.');
      return;
    }
    if (this.hasPackageOrderChange(pkg.id)) {
      this.toast.warning('Guarda primero el orden modificado de este paquete.');
      return;
    }

    this.runRowAction(
      pkg.id,
      this.logisticsSvc.markDeliveryInTransit(pkg.id),
      'Paquete marcado en tránsito.',
    );
  }

  cancelDelivery(pkg: PackageDto): void {
    if (pkg.deliveryStatus === 'Completed') {
      this.toast.warning('No se puede cancelar un paquete completado.');
      return;
    }
    this.runRowAction(pkg.id, this.logisticsSvc.cancelDelivery(pkg.id), 'Entrega cancelada.');
  }

  markFailed(pkg: PackageDto): void {
    this.runRowAction(
      pkg.id,
      this.logisticsSvc.markDeliveryFailed(pkg.id),
      'Paquete marcado como fallido.',
    );
  }

  onEvidenceSelected(packageId: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.toast.error('Selecciona una imagen válida para la evidencia.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      this.evidenceByPackage.update((state) => ({ ...state, [packageId]: result }));
    };
    reader.onerror = () => this.toast.error('No se pudo leer la imagen seleccionada.');
    reader.readAsDataURL(file);
  }

  completeDelivery(pkg: PackageDto): void {
    const evidence = (this.evidenceByPackage()[pkg.id] ?? '').trim();
    if (!evidence) {
      this.toast.warning('Para completar la entrega, adjunta una evidencia en imagen.');
      return;
    }
    this.runRowAction(
      pkg.id,
      this.logisticsSvc.markDeliveryCompleted(pkg.id, evidence),
      'Entrega completada.',
    );
  }

  onIncidentTypeChange(packageId: string, value: string): void {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 4) return;
    this.incidentTypeByPackage.update((state) => ({
      ...state,
      [packageId]: parsed as IncidentType,
    }));
  }

  onIncidentDescriptionChange(packageId: string, value: string): void {
    this.incidentDescriptionByPackage.update((state) => ({ ...state, [packageId]: value }));
  }

  registerIncident(pkg: PackageDto): void {
    if (pkg.deliveryStatus !== 'Failed') {
      this.toast.warning('Solo se puede registrar incidente para paquetes fallidos.');
      return;
    }

    const incidentType = this.incidentTypeByPackage()[pkg.id] ?? 0;
    const incidentDescription = (this.incidentDescriptionByPackage()[pkg.id] ?? '').trim();
    if (!incidentDescription) {
      this.toast.warning('La descripción del incidente es obligatoria.');
      return;
    }

    this.runRowAction(
      pkg.id,
      this.logisticsSvc.registerDeliveryIncident(pkg.id, incidentType, incidentDescription),
      'Incidente registrado.',
    );
  }

  isBusy(packageId: string): boolean {
    return !!this.rowBusy()[packageId] || this.loading() || this.savingOrders();
  }

  private loadPackages(): void {
    const driverId = this.driverId();
    if (!driverId) return;

    this.loading.set(true);
    this.logisticsSvc
      .getPackagesByDriverAndDate(driverId, this.selectedDate())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => {
          const sorted = [...(data ?? [])].sort(
            (a, b) => (a.deliveryOrder ?? Number.MAX_SAFE_INTEGER) - (b.deliveryOrder ?? Number.MAX_SAFE_INTEGER),
          );
          this.packages.set(sorted);
          this.bootstrapDrafts(sorted);
        },
        error: (err) => {
          this.packages.set([]);
          this.toast.error(this.extractError(err));
        },
      });
  }

  private bootstrapDrafts(list: PackageDto[]): void {
    const orders: Record<string, number | null> = {};
    const incidentTypes: Record<string, IncidentType> = {};
    const descriptions: Record<string, string> = {};

    for (const p of list) {
      orders[p.id] = p.deliveryOrder ?? null;
      incidentTypes[p.id] = 0;
      descriptions[p.id] = p.incidentDescription ?? '';
    }

    this.orderDrafts.set(orders);
    this.incidentTypeByPackage.set(incidentTypes);
    this.incidentDescriptionByPackage.set(descriptions);
    this.evidenceByPackage.set({});
  }

  private hasPackageOrderChange(packageId: string): boolean {
    const pkg = this.packages().find((p) => p.id === packageId);
    if (!pkg) return false;
    const draft = this.orderDrafts()[packageId];
    if (draft === undefined || draft === null) return false;
    return draft !== (pkg.deliveryOrder ?? null);
  }

  private runRowAction(
    packageId: string,
    request$: ReturnType<LogisticsService['markDeliveryFailed']>,
    successMessage: string,
  ): void {
    this.setRowBusy(packageId, true);
    request$
      .pipe(finalize(() => this.setRowBusy(packageId, false)))
      .subscribe({
        next: () => {
          this.toast.success(successMessage);
          this.loadPackages();
        },
        error: (err) => this.toast.error(this.extractError(err)),
      });
  }

  private setRowBusy(packageId: string, value: boolean): void {
    this.rowBusy.update((state) => ({ ...state, [packageId]: value }));
  }

  private extractError(err: unknown): string {
    if (!err || typeof err !== 'object') {
      return 'Ocurrió un error inesperado en logística.';
    }

    const e = err as {
      status?: number;
      message?: string;
      error?: {
        message?: string;
        error?: string;
        title?: string;
        errors?: Record<string, string[]>;
      };
    };

    if (e.error?.errors) {
      const list = Object.values(e.error.errors).flat();
      if (list.length) return list.join(' · ');
    }

    if (e.status === 400) {
      return e.error?.message ?? e.error?.error ?? e.error?.title ?? e.message ?? 'Solicitud inválida.';
    }

    return e.error?.message ?? e.error?.error ?? e.error?.title ?? e.message ?? 'Error de servicio de logística.';
  }
}

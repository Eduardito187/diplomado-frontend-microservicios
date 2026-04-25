import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { ToastService } from '../../core/services/toast.service';
import { SuscripcionesService } from '../../core/services/suscripciones';
import {
  ActualizarSuscripcionDto,
  CrearSuscripcionDto,
  Suscripcion,
} from '../../core/models/suscripcion.model';

type SuscripcionModalMode = 'create' | 'edit' | null;

@Component({
  selector: 'app-suscripciones',
  imports: [DatePipe, ReactiveFormsModule, EmptyState],
  templateUrl: './suscripciones.html',
  styleUrl: './suscripciones.scss',
})
export class Suscripciones implements OnInit {
  private readonly svc = inject(SuscripcionesService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal<boolean>(true);
  readonly saving = signal<boolean>(false);
  readonly suscripciones = signal<Suscripcion[]>([]);
  readonly modalMode = signal<SuscripcionModalMode>(null);
  readonly selected = signal<Suscripcion | null>(null);

  readonly suscripcionForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    descripcion: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(250)]],
    cantidadDias: [1, [Validators.required, Validators.min(1), Validators.max(365)]],
    precioDia: [1, [Validators.required, Validators.min(1)]],
  });

  readonly totalPrecioDia = computed(() =>
    this.suscripciones().reduce((acc, item) => acc + (item.precioDia ?? 0), 0),
  );

  readonly showModal = computed(() => this.modalMode() !== null);
  readonly isCreateMode = computed(() => this.modalMode() === 'create');

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.svc
      .getSuscripciones()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => {
          const sorted = [...(data ?? [])].sort((a, b) => (a.nombre ?? '').localeCompare(b.nombre ?? ''));
          this.suscripciones.set(sorted);
        },
        error: (err) => {
          this.suscripciones.set([]);
          this.toast.error(err?.message ?? 'No se pudo cargar suscripciones.');
        },
      });
  }

  openCreateModal(): void {
    this.modalMode.set('create');
    this.selected.set(null);
    this.suscripcionForm.reset({
      nombre: '',
      descripcion: '',
      cantidadDias: 1,
      precioDia: 1,
    });
  }

  openEditModal(item: Suscripcion): void {
    this.modalMode.set('edit');
    this.selected.set(item);
    this.suscripcionForm.reset({
      nombre: item.nombre ?? '',
      descripcion: item.descripcion ?? '',
      cantidadDias: item.cantidadDias ?? 1,
      precioDia: item.precioDia ?? 1,
    });
  }

  closeModal(): void {
    this.modalMode.set(null);
    this.selected.set(null);
    this.suscripcionForm.reset({
      nombre: '',
      descripcion: '',
      cantidadDias: 1,
      precioDia: 1,
    });
  }

  save(): void {
    this.suscripcionForm.markAllAsTouched();
    if (this.suscripcionForm.invalid) return;

    const dto = this.suscripcionForm.getRawValue();
    const mode = this.modalMode();

    if (mode === 'create') {
      this.saveCreate(dto);
      return;
    }

    if (mode === 'edit') {
      this.saveEdit(dto);
    }
  }

  private saveCreate(dto: CrearSuscripcionDto): void {
    this.saving.set(true);
    this.svc
      .createSuscripcion(dto)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (id) => {
          this.toast.success('Suscripcion creada correctamente. ID: ' + id);
          this.closeModal();
          this.load();
        },
        error: (err) => {
          this.toast.error(err?.message ?? 'No se pudo crear la suscripcion.');
        },
      });
  }

  private saveEdit(dto: ActualizarSuscripcionDto): void {
    const current = this.selected();
    if (!current) return;

    this.saving.set(true);
    this.svc
      .updateSuscripcion(current.id, dto)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.toast.success('Suscripcion actualizada correctamente.');
          this.closeModal();
          this.load();
        },
        error: (err) => {
          this.toast.error(err?.message ?? 'No se pudo actualizar la suscripcion.');
        },
      });
  }
}

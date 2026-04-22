import { Component, OnInit, signal, computed, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';

function pastDateValidator(control: AbstractControl): ValidationErrors | null {
  const v = control.value;
  if (!v) return null;
  const parsed = new Date(v);
  if (Number.isNaN(parsed.getTime())) return { pastDate: true };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parsed < today ? null : { pastDate: true };
}

import { PatientService } from '../../core/services/patient.service';
import { ToastService } from '../../core/services/toast.service';
import { Patient, CreatePatientDto, CreateAddressDto } from '../../core/models/patient.model';
import { BadgeStatus } from '../../shared/components/badge-status/badge-status';
import { EmptyState } from '../../shared/components/empty-state/empty-state';

type ModalMode = 'create' | 'edit' | 'view' | 'address' | null;

@Component({
  selector: 'app-patients',
  imports: [ReactiveFormsModule, BadgeStatus, EmptyState],
  templateUrl: './patients.html',
  styleUrl: './patients.scss',
})
export class Patients implements OnInit {
  private readonly svc = inject(PatientService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly patients = signal<Patient[]>([]);
  readonly searchQuery = signal('');
  readonly modalMode = signal<ModalMode>(null);
  readonly selected = signal<Patient | null>(null);
  readonly deleteTarget = signal<Patient | null>(null);

  readonly filtered = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.patients();
    return this.patients().filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.lastname?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        (p.document ?? '').includes(q)
    );
  });

  readonly patientForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]],
    lastname: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]],
    email: ['', [Validators.email, Validators.maxLength(255)]],
    cellphone: ['', [Validators.maxLength(255)]],
    birthDate: ['', [Validators.required, pastDateValidator]],
    document: ['', [Validators.required, Validators.maxLength(255)]],
    subscriptionId: [''],
  });

  readonly addressForm = this.fb.nonNullable.group({
    label: ['Principal'],
    line1: ['', Validators.required],
    line2: [''],
    country: ['Bolivia'],
    province: [''],
    city: ['', Validators.required],
    latitude: [null as number | null],
    longitude: [null as number | null],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.svc
      .getAll()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => this.patients.set(data ?? []),
        error: () => this.toast.error('No se pudo cargar la lista de pacientes.'),
      });
  }

  openCreate(): void {
    this.patientForm.reset();
    this.selected.set(null);
    this.modalMode.set('create');
  }

  openEdit(p: Patient): void {
    this.selected.set(p);
    this.patientForm.patchValue({
      name: p.name,
      lastname: p.lastname,
      email: p.email,
      cellphone: p.cellphone ?? '',
      birthDate: p.birthDate ?? '',
      document: p.document ?? '',
      subscriptionId: p.subscriptionId ?? '',
    });
    this.modalMode.set('edit');
  }

  openView(p: Patient): void {
    this.selected.set(p);
    this.modalMode.set('view');
  }

  openAddAddress(p: Patient): void {
    this.selected.set(p);
    this.addressForm.reset({ country: 'Bolivia', label: 'Principal' });
    this.modalMode.set('address');
  }

  closeModal(): void {
    this.modalMode.set(null);
    this.selected.set(null);
  }

  confirmDelete(p: Patient): void {
    this.deleteTarget.set(p);
  }

  cancelDelete(): void {
    this.deleteTarget.set(null);
  }

  submitPatient(): void {
    if (this.patientForm.invalid) {
      this.patientForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const raw = this.patientForm.getRawValue();
    const dto: CreatePatientDto = {
      name: raw.name,
      lastname: raw.lastname,
      email: raw.email,
      cellphone: raw.cellphone || undefined,
      birthDate: raw.birthDate || undefined,
      document: raw.document || undefined,
      subscriptionId: raw.subscriptionId || null,
    };
    const mode = this.modalMode();

    if (mode === 'create') {
      this.svc
        .create(dto)
        .pipe(finalize(() => this.saving.set(false)))
        .subscribe({
          next: () => {
            this.toast.success(`Paciente ${dto.name} creado.`);
            this.closeModal();
            this.load();
          },
          error: (err) => this.toast.error(err?.message ?? 'Error al crear el paciente.'),
        });
    } else if (mode === 'edit') {
      const current = this.selected();
      if (!current) return;
      this.svc
        .update(current.id, dto)
        .pipe(finalize(() => this.saving.set(false)))
        .subscribe({
          next: () => {
            this.toast.success('Paciente actualizado correctamente.');
            this.closeModal();
            this.load();
          },
          error: (err) => this.toast.error(err?.message ?? 'Error al actualizar el paciente.'),
        });
    }
  }

  submitAddress(): void {
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }
    const patient = this.selected();
    if (!patient) return;
    this.saving.set(true);
    const dto = this.addressForm.getRawValue() as CreateAddressDto;
    this.svc
      .addAddress(patient.id, dto)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.toast.success('Dirección agregada.');
          this.closeModal();
          this.load();
        },
        error: () => this.toast.error('Error al agregar la dirección.'),
      });
  }

  deletePatient(): void {
    const target = this.deleteTarget();
    if (!target) return;
    this.svc
      .delete(target.id)
      .pipe(finalize(() => this.deleteTarget.set(null)))
      .subscribe({
        next: () => {
          this.patients.update((list) => list.filter((p) => p.id !== target.id));
          this.toast.success(`Paciente ${target.name} eliminado.`);
        },
        error: () => this.toast.error('Error al eliminar el paciente.'),
      });
  }

  initials(p: Patient): string {
    return `${p.name?.[0] ?? ''}${p.lastname?.[0] ?? ''}`.toUpperCase();
  }

  fullName(p: Patient): string {
    return `${p.name ?? ''} ${p.lastname ?? ''}`.trim();
  }

  subscriptionBadge(p: Patient): 'active' | 'inactive' {
    return p.subscriptionStatus?.toUpperCase() === 'ACTIVE' ? 'active' : 'inactive';
  }
}

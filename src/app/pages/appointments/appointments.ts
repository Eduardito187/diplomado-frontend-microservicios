import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AppointmentService } from '../../core/services/appointment.service';
import { PatientService } from '../../core/services/patient.service';
import { ToastService } from '../../core/services/toast.service';
import { Auth } from '../../core/services/auth';
import { SECTION_ROLES } from '../../core/config/roles';
import { ensureRole } from '../../core/utils/role-check';
import {
  Nutritionist,
  ScheduledAppointment,
  CreateNutritionistDto,
} from '../../core/models/appointment.model';
import { Patient } from '../../core/models/patient.model';
import { BadgeStatus } from '../../shared/components/badge-status/badge-status';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { forkJoin, catchError, of } from 'rxjs';

function toLocalYyyyMmDd(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDdMmYyyyHms(dateInput: any): Date {
  if (dateInput instanceof Date) return dateInput;
  if (!dateInput) return new Date(Number.NaN);

  // Parsea array [year, month, day, hour, minute]
  if (Array.isArray(dateInput) && dateInput.length >= 3) {
    const [y, m, d, h = 0, min = 0, s = 0] = dateInput;
    return new Date(y, m - 1, d, h, min, s);
  }

  // Parsea string formato "dd-mm-yyyy hh:mm:ss"
  if (typeof dateInput === 'string') {
    const [datePart, timePart = '00:00:00'] = dateInput.split(' ');
    const [d, m, y] = datePart.split('-');
    const [h, min, s] = timePart.split(':');
    return new Date(
      Number.parseInt(y, 10),
      Number.parseInt(m, 10) - 1,
      Number.parseInt(d, 10),
      Number.parseInt(h, 10),
      Number.parseInt(min, 10),
      Number.parseInt(s, 10)
    );
  }

  return new Date(Number.NaN);
}

type ModalMode =
  | 'schedule'
  | 'attend'
  | 'nutritionist-create'
  | 'nutritionist-edit'
  | 'view-detail'
  | null;

const SPECIALTIES: Record<string, string> = {
  'Clinical Nutrition': 'Nutrición Clínica',
  'Sports Nutrition': 'Nutrición Deportiva',
  'Functional Nutrition': 'Nutrición Funcional',
  'Geriatric Nutrition': 'Nutrición Geriátrica',
  'Preventive Nutrition': 'Nutrición Preventiva',
};

const NUTRITIONAL_STATES: Record<string, string> = {
  Underweight: 'Bajo peso',
  'Normal weight': 'Peso normal',
  Overweight: 'Sobrepeso',
  Obesity: 'Obesidad',
};

const APPOINTMENT_STATUSES: Record<string, string> = {
  Scheduled: 'Programada',
  Completed: 'Completada',
  Cancelled: 'Cancelada',
  Closed: 'Cerrada',
};

const APPOINTMENT_TYPES: Record<string, string> = {
  Initial: 'Inicial',
  'Follow up': 'Seguimiento',
};

@Component({
  selector: 'app-appointments',
  imports: [ReactiveFormsModule, BadgeStatus, EmptyState],
  templateUrl: './appointments.html',
  styleUrl: './appointments.scss',
})
export class Appointments implements OnInit {
  private readonly aptSvc = inject(AppointmentService);
  private readonly patSvc = inject(PatientService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly saving = signal(false);

  readonly nutritionists = signal<Nutritionist[]>([]);
  readonly patients = signal<Patient[]>([]);

  readonly selectedNutritionistId = signal<string>('');
  readonly selectedDate = signal<string>(toLocalYyyyMmDd(new Date()));
  readonly appointments = signal<ScheduledAppointment[]>([]);
  readonly appointmentsLoading = signal(false);

  readonly modalMode = signal<ModalMode>(null);
  readonly selectedAppointment = signal<ScheduledAppointment | null>(null);
  readonly selectedNutritionist = signal<Nutritionist | null>(null);
  readonly appointmentDetail = signal<any>(null);
  readonly detailLoading = signal(false);
  readonly availableHours = signal<string[]>([]);
  readonly hoursLoading = signal(false);
  readonly selectedScheduleDate = signal<string>('');
  readonly selectedScheduleHour = signal<string>('');

  readonly scheduleForm = this.fb.nonNullable.group({
    patientId: ['', Validators.required],
    nutritionistId: ['', Validators.required],
    type: ['CONSULTATION', Validators.required],
    scheduleDate: ['', Validators.required],
  });

  readonly attendForm = this.fb.nonNullable.group({
    notes: [''],
    weightKg: [null as number | null],
    heightCm: [null as number | null],
    imc: [null as number | null],
    bodyFatPercent: [null as number | null],
    muscleMass: [null as number | null],
    diagnosisSummary: [''],
    nutritionalState: [''],
    associatedRisks: [''],
    recommendations: [''],
    goals: [''],
    comments: [''],
  });

  readonly nutritionistForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    lastname: ['', Validators.required],
    specialty: [''],
    professionalLicense: [''],
  });

  readonly summary = computed(() => ({
    total: this.appointments().length,
    attended: this.appointments().filter((a) => (a.status ?? '').toUpperCase() === 'ATTENDED').length,
    scheduled: this.appointments().filter((a) => (a.status ?? '').toUpperCase() === 'SCHEDULED').length,
    cancelled: this.appointments().filter((a) => (a.status ?? '').toUpperCase() === 'CANCELLED').length,
  }));

  ngOnInit(): void {
    if (!ensureRole(SECTION_ROLES.appointments, this.auth, this.router)) return;
    this.loadDirectory();
  }

  loadDirectory(): void {
    this.loading.set(true);
    forkJoin({
      nutritionists: this.aptSvc.getNutritionists().pipe(catchError(() => of([] as Nutritionist[]))),
      patients: this.patSvc.getAll().pipe(catchError(() => of([] as Patient[]))),
    }).subscribe(({ nutritionists, patients }) => {
      this.nutritionists.set(nutritionists);
      this.patients.set(patients);
      if (nutritionists.length && !this.selectedNutritionistId()) {
        this.selectedNutritionistId.set(nutritionists[0].id);
        this.loadAppointments();
      }
      this.loading.set(false);
    });
  }

  loadAppointments(): void {
    const nid = this.selectedNutritionistId();
    const date = this.selectedDate();
    if (!nid || !date) return;
    this.appointmentsLoading.set(true);
    this.aptSvc.getAppointmentsByNutritionistAndDate(nid, date).subscribe({
      next: (data) => {
        this.appointments.set(data ?? []);
        this.appointmentsLoading.set(false);
      },
      error: () => {
        this.appointments.set([]);
        this.appointmentsLoading.set(false);
        this.toast.error('No se pudieron cargar las citas del nutricionista.');
      },
    });
  }

  onNutritionistChange(id: string): void {
    this.selectedNutritionistId.set(id);
    this.loadAppointments();
  }

  onDateChange(date: string): void {
    this.selectedDate.set(date);
    this.loadAppointments();
  }

  openSchedule(): void {
    this.scheduleForm.reset({
      patientId: '',
      nutritionistId: this.selectedNutritionistId(),
      type: 'CONSULTATION',
      scheduleDate: '',
    });
    this.selectedScheduleDate.set('');
    this.selectedScheduleHour.set('');
    this.availableHours.set([]);
    this.modalMode.set('schedule');
  }

  openAttend(a: ScheduledAppointment): void {
    this.selectedAppointment.set(a);
    this.attendForm.reset();
    this.modalMode.set('attend');
  }

  openNutritionistCreate(): void {
    this.nutritionistForm.reset();
    this.selectedNutritionist.set(null);
    this.modalMode.set('nutritionist-create');
  }

  openNutritionistEdit(n: Nutritionist): void {
    this.selectedNutritionist.set(n);
    this.nutritionistForm.patchValue({
      name: n.name,
      lastname: n.lastname,
      specialty: n.specialty ?? '',
      professionalLicense: n.professionalLicense ?? '',
    });
    this.modalMode.set('nutritionist-edit');
  }

  closeModal(): void {
    this.modalMode.set(null);
    this.selectedAppointment.set(null);
    this.selectedNutritionist.set(null);
    this.appointmentDetail.set(null);
  }

  submitSchedule(): void {
    if (this.scheduleForm.invalid) {
      this.scheduleForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.aptSvc.schedule(this.scheduleForm.getRawValue()).subscribe({
      next: () => {
        this.toast.success('Cita programada.');
        this.closeModal();
        this.saving.set(false);
        this.loadAppointments();
      },
      error: (err) => {
        this.toast.error(err?.message ?? 'Error al programar la cita.');
        this.saving.set(false);
      },
    });
  }

  submitAttend(): void {
    const apt = this.selectedAppointment();
    if (!apt) return;
    this.saving.set(true);
    const f = this.attendForm.getRawValue();
    this.aptSvc
      .attend({
        id: apt.id,
        notes: f.notes || undefined,
        measurementDto: {
          weight: f.weightKg ?? undefined,
          height: f.heightCm ?? undefined,
          imc: f.imc ?? undefined,
          bodyFat: f.bodyFatPercent ?? undefined,
          muscleMass: f.muscleMass ?? undefined,
        },
        diagnosisDto: {
          description: f.diagnosisSummary || undefined,
          nutritionalState: f.nutritionalState || undefined,
          associatedRisks: f.associatedRisks || undefined,
          recommendations: f.recommendations || undefined,
          goals: f.goals || undefined,
          comments: f.comments || undefined,
        },
      })
      .subscribe({
        next: () => {
          this.toast.success('Cita atendida.');
          this.closeModal();
          this.saving.set(false);
          this.loadAppointments();
        },
        error: () => {
          this.toast.error('Error al registrar la atención.');
          this.saving.set(false);
        },
      });
  }

  cancelAppointment(apt: ScheduledAppointment): void {
    this.aptSvc.cancel(apt.id).subscribe({
      next: () => {
        this.toast.success('Cita cancelada.');
        this.loadAppointments();
      },
      error: () => this.toast.error('Error al cancelar la cita.'),
    });
  }

  markNotAttended(apt: ScheduledAppointment): void {
    this.aptSvc.notAttended(apt.id).subscribe({
      next: () => {
        this.toast.warning('Cita marcada como no asistida.');
        this.loadAppointments();
      },
      error: () => this.toast.error('Error al actualizar la cita.'),
    });
  }

  submitNutritionist(): void {
    if (this.nutritionistForm.invalid) {
      this.nutritionistForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const dto = this.nutritionistForm.getRawValue() as CreateNutritionistDto;
    const mode = this.modalMode();

    if (mode === 'nutritionist-create') {
      this.aptSvc.createNutritionist(dto).subscribe({
        next: () => {
          this.toast.success('Nutricionista creado.');
          this.closeModal();
          this.saving.set(false);
          this.loadDirectory();
        },
        error: () => {
          this.toast.error('Error al crear nutricionista.');
          this.saving.set(false);
        },
      });
    } else if (mode === 'nutritionist-edit') {
      const current = this.selectedNutritionist();
      if (!current) return;
      this.aptSvc.updateNutritionist({ id: current.id, ...dto }).subscribe({
        next: () => {
          this.toast.success('Nutricionista actualizado.');
          this.closeModal();
          this.saving.set(false);
          this.loadDirectory();
        },
        error: () => {
          this.toast.error('Error al actualizar nutricionista.');
          this.saving.set(false);
        },
      });
    }
  }

  deleteNutritionist(n: Nutritionist): void {
    this.aptSvc.deleteNutritionist(n.id).subscribe({
      next: () => {
        this.toast.success('Nutricionista eliminado.');
        this.loadDirectory();
      },
      error: () => this.toast.error('Error al eliminar nutricionista.'),
    });
  }

  formatDate(date: string): string {
    if (!date) return '—';
    const parsed = parseDdMmYyyyHms(date);
    if (Number.isNaN(parsed.getTime())) return '—';
    return new Intl.DateTimeFormat('es-BO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(parsed);
  }

  patientName(id: string): string {
    const p = this.patients().find((x) => x.id === id);
    return p ? `${p.name} ${p.lastname}` : id;
  }

  nutritionistFullName(n: Nutritionist): string {
    return `${n.name} ${n.lastname}`;
  }

  statusKey(s?: string): string {
    return (s ?? 'SCHEDULED').toUpperCase();
  }

  isScheduled(a: ScheduledAppointment): boolean {
    return this.statusKey(a.status) === 'SCHEDULED';
  }

  getSpecialties(): Array<{ key: string; label: string }> {
    return Object.entries(SPECIALTIES).map(([key, label]) => ({ key, label }));
  }

  getSpecialtyLabel(key: string): string {
    return SPECIALTIES[key] ?? key;
  }

  getNutritionalStates(): Array<{ key: string; label: string }> {
    return Object.entries(NUTRITIONAL_STATES).map(([key, label]) => ({ key, label }));
  }

  getNutritionalStateLabel(key: string): string {
    return NUTRITIONAL_STATES[key] ?? key;
  }

  openAppointmentDetail(apt: ScheduledAppointment): void {
    this.detailLoading.set(true);
    this.aptSvc.getAppointmentDetail(apt.id).subscribe({
      next: (detail) => {
        this.appointmentDetail.set(detail);
        this.detailLoading.set(false);
        this.modalMode.set('view-detail');
      },
      error: () => {
        this.toast.error('Error al cargar el detalle de la cita.');
        this.detailLoading.set(false);
      },
    });
  }

  private parseDecimalValue(value: any): number | null {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const match = /DecimalValue\[value=([\d.]+)\]/.exec(value);
      return match ? Number.parseFloat(match[1]) : null;
    }
    return null;
  }

  getMeasurementValue(field: any): number | null {
    if (!field) return null;
    if (typeof field === 'number') return field;
    if (field.value) return this.parseDecimalValue(field.value);
    return this.parseDecimalValue(field);
  }

  getDiagnosisNutritionalState(state: string): string {
    if (!state) return '—';
    const stateMap: Record<string, string> = {
      UNDERWEIGHT: 'Bajo peso',
      NORMAL_WEIGHT: 'Peso normal',
      OVERWEIGHT: 'Sobrepeso',
      OBESITY: 'Obesidad',
    };
    return stateMap[state] ?? state;
  }

  getStatusLabel(status: string): string {
    return APPOINTMENT_STATUSES[status] ?? status;
  }

  getAppointmentTypeLabel(type?: string): string {
    if (!type) return '—';
    return APPOINTMENT_TYPES[type] ?? type;
  }

  onScheduleDateChange(date: string): void {
    if (!date) {
      this.selectedScheduleDate.set('');
      this.selectedScheduleHour.set('');
      this.scheduleForm.patchValue({ scheduleDate: '' });
      this.availableHours.set([]);
      return;
    }

    if (this.isWeekend(date)) {
      this.toast.error('No se pueden programar citas los sábados y domingos');
      return;
    }

    this.selectedScheduleDate.set(date);
    this.selectedScheduleHour.set('');
    this.scheduleForm.patchValue({ scheduleDate: '' });
    this.loadAvailableHours(date);
  }

  onScheduleNutritionistChange(nutritionistId: string): void {
    this.scheduleForm.patchValue({ nutritionistId });
    const date = this.selectedScheduleDate();

    if (date) {
      this.selectedScheduleHour.set('');
      this.scheduleForm.patchValue({ scheduleDate: '' });
      this.loadAvailableHours(date);
    }
  }

  private loadAvailableHours(date: string): void {
    const nid = this.scheduleForm.get('nutritionistId')?.value;
    if (!nid) return;

    this.hoursLoading.set(true);
    this.aptSvc.getAppointmentsByNutritionistAndDate(nid, date).subscribe({
      next: (appointments) => {
        const occupiedHours = this.extractOccupiedHours(appointments);
        this.availableHours.set(this.generateAvailableHours(occupiedHours));
        this.hoursLoading.set(false);
      },
      error: () => {
        this.availableHours.set(this.generateAvailableHours([]));
        this.hoursLoading.set(false);
      },
    });
  }

  onScheduleHourChange(hour: string): void {
    this.selectedScheduleHour.set(hour);
    const date = this.selectedScheduleDate();
    if (date && hour) {
      const datetime = `${date}T${hour}`;
      this.scheduleForm.patchValue({ scheduleDate: datetime });
    }
  }

  private extractOccupiedHours(appointments: ScheduledAppointment[]): string[] {
    return appointments
      .filter((apt) => apt.scheduleDate && apt.status?.toUpperCase() !== 'CANCELLED')
      .map((apt) => {
        const date = parseDdMmYyyyHms(apt.scheduleDate);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
      });
  }

  private generateAvailableHours(occupiedHours: string[]): string[] {
    const hours: string[] = [];
    for (let h = 8; h < 18; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hour = String(h).padStart(2, '0');
        const minute = String(m).padStart(2, '0');
        const timeStr = `${hour}:${minute}`;
        if (!occupiedHours.includes(timeStr)) {
          hours.push(timeStr);
        }
      }
    }
    return hours;
  }

  private isWeekend(dateStr: string): boolean {
    const date = new Date(`${dateStr}T00:00:00`);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  }
}

export type AppointmentStatus = 'SCHEDULED' | 'CANCELLED' | 'ATTENDED' | 'NOT_ATTENDED';

export interface ScheduledAppointment {
  id: string;
  patientId: string;
  type?: string;
  scheduleDate: string;
  status?: string;
  attendance?: string;
}

export interface Nutritionist {
  id: string;
  name: string;
  lastname: string;
  specialty?: string;
  professionalLicense?: string;
}

export interface ScheduleAppointmentDto {
  patientId: string;
  nutritionistId: string;
  type: string;
  scheduleDate: string;
}

export interface CreateNutritionistDto {
  name: string;
  lastname: string;
  specialty?: string;
  professionalLicense?: string;
}

export interface UpdateNutritionistDto extends CreateNutritionistDto {
  id: string;
}

export interface MeasurementDto {
  weightKg?: number;
  heightCm?: number;
  bodyFatPercent?: number;
}

export interface DiagnosisDto {
  summary?: string;
  recommendations?: string;
}

export interface AttendAppointmentDto {
  id: string;
  notes?: string;
  measurementDto?: MeasurementDto;
  diagnosisDto?: DiagnosisDto;
}

export const APPOINTMENT_STATUS_MAP: Record<
  string,
  { label: string; cssClass: string; icon: string }
> = {
  SCHEDULED: { label: 'Programada', cssClass: 'badge-scheduled', icon: 'bi-calendar-check' },
  CANCELLED: { label: 'Cancelada', cssClass: 'badge-cancelled', icon: 'bi-x-circle' },
  ATTENDED: { label: 'Atendida', cssClass: 'badge-attended', icon: 'bi-check-circle-fill' },
  NOT_ATTENDED: { label: 'No asistió', cssClass: 'badge-no-show', icon: 'bi-dash-circle' },
};

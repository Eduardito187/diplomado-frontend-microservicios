import { Component, input } from '@angular/core';

@Component({
  selector: 'app-badge-status',
  template: `
    <span class="status-badge status-{{ cssClass() }}">
      @if (icon()) {
        <i class="bi {{ icon() }}"></i>
      }
      {{ label() }}
    </span>
  `,
  styles: [`
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.25rem 0.65rem;
      border-radius: 20px;
      font-size: 0.72rem;
      font-weight: 600;
      white-space: nowrap;
    }

    .status-badge-scheduled { background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; }
    .status-badge-cancelled  { background:#fef2f2; color:#b91c1c; border:1px solid #fecaca; }
    .status-badge-attended   { background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0; }
    .status-badge-no-show    { background:#fffbeb; color:#92400e; border:1px solid #fde68a; }
    .status-badge-creada      { background:#f8fafc; color:#475569; border:1px solid #e2e8f0; }
    .status-badge-planificada { background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; }
    .status-badge-en-proceso  { background:#fffbeb; color:#92400e; border:1px solid #fde68a; }
    .status-badge-cerrada     { background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0; }
    .status-badge-despachada  { background:#ecfdf5; color:#065f46; border:1px solid #a7f3d0; }
    .status-badge-activo   { background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0; }
    .status-badge-inactivo { background:#f9fafb; color:#6b7280; border:1px solid #e5e7eb; }
    .status-badge-pending   { background:#fff7ed; color:#c2410c; border:1px solid #fed7aa; }
    .status-badge-in-transit { background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; }
    .status-badge-completed { background:#f0fdf4; color:#166534; border:1px solid #bbf7d0; }
    .status-badge-failed    { background:#fef2f2; color:#b91c1c; border:1px solid #fecaca; }
    .status-badge-default { background:#f1f5f9; color:#475569; border:1px solid #e2e8f0; }
  `],
})
export class BadgeStatus {
  readonly status = input.required<string>();

  private readonly statusMap: Record<string, { label: string; css: string; icon?: string }> = {
    PROGRAMADA:   { label: 'Programada',  css: 'scheduled',  icon: 'bi-calendar-check' },
    CANCELADA:    { label: 'Cancelada',   css: 'cancelled',  icon: 'bi-x-circle' },
    ATENDIDA:     { label: 'Atendida',    css: 'attended',   icon: 'bi-check-circle-fill' },
    NO_ATENDIDA:  { label: 'No asistió',  css: 'no-show',    icon: 'bi-dash-circle' },
    CREADA:       { label: 'Creada',      css: 'creada',     icon: 'bi-file-earmark-plus' },
    PLANIFICADA:  { label: 'Planificada', css: 'planificada',icon: 'bi-diagram-3' },
    EN_PROCESO:   { label: 'En proceso',  css: 'en-proceso', icon: 'bi-gear-wide-connected' },
    CERRADA:      { label: 'Cerrada',     css: 'cerrada',    icon: 'bi-check2-all' },
    DESPACHADA:   { label: 'Despachada',  css: 'despachada', icon: 'bi-truck' },
    ACTIVO:       { label: 'Activo',      css: 'activo' },
    INACTIVO:     { label: 'Inactivo',    css: 'inactivo' },
    active:       { label: 'Activo',      css: 'activo' },
    inactive:     { label: 'Inactivo',    css: 'inactivo' },
    SCHEDULED:    { label: 'Programada',  css: 'scheduled',  icon: 'bi-calendar-check' },
    CANCELLED:    { label: 'Cancelada',   css: 'cancelled',  icon: 'bi-x-circle' },
    ATTENDED:     { label: 'Atendida',    css: 'attended',   icon: 'bi-check-circle-fill' },
    NOT_ATTENDED: { label: 'No asistió',  css: 'no-show',    icon: 'bi-dash-circle' },
    COMPLETED:    { label: 'Completada',  css: 'completed',  icon: 'bi-check2-circle' },
    CLOSED:       { label: 'Cerrada',     css: 'cerrada',    icon: 'bi-check2-all' },
    Pending:      { label: 'Pendiente',   css: 'pending',    icon: 'bi-hourglass-split' },
    InTransit:    { label: 'En tránsito', css: 'in-transit', icon: 'bi-truck' },
    Completed:    { label: 'Completada',  css: 'completed',  icon: 'bi-check2-circle' },
    Failed:       { label: 'Fallida',     css: 'failed',     icon: 'bi-exclamation-circle' },
    Cancelled:    { label: 'Cancelada',   css: 'cancelled',  icon: 'bi-x-circle' },
    Closed:       { label: 'Cerrada',     css: 'cerrada',    icon: 'bi-check2-all' },
  };

  label(): string {
    return this.statusMap[this.status()]?.label ?? this.status();
  }

  cssClass(): string {
    return `badge-${this.statusMap[this.status()]?.css ?? 'default'}`;
  }

  icon(): string {
    return this.statusMap[this.status()]?.icon ?? '';
  }
}

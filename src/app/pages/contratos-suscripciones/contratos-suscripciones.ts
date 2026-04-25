import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { finalize } from 'rxjs';
import {
  Contrato,
  CONTRATO_ESTADO_MAP,
  EntregaCalendario,
  ENTREGA_ESTADO_MAP,
  AccionEntrega,
  ActualizarCalendarioEntregaDto,
} from '../../core/models/contrato.model';
import { ContratosSuscripcionesService } from '../../core/services/contratos-suscripciones';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-contratos-suscripciones',
  imports: [DatePipe, CommonModule, ReactiveFormsModule, EmptyState],
  templateUrl: './contratos-suscripciones.html',
  styleUrl: './contratos-suscripciones.scss',
})
export class ContratosSuscripciones implements OnInit {
  private readonly svc = inject(ContratosSuscripcionesService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal<boolean>(true);
  readonly contratos = signal<Contrato[]>([]);
  readonly showEntregasModal = signal<boolean>(false);
  readonly loadingEntregas = signal<boolean>(false);
  readonly contratoSeleccionado = signal<Contrato | null>(null);
  readonly entregasCalendario = signal<EntregaCalendario[]>([]);

  // Modal de acciones
  readonly showAccionModal = signal<boolean>(false);
  readonly accionSeleccionada = signal<AccionEntrega | null>(null);
  readonly entregaSeleccionada = signal<EntregaCalendario | null>(null);
  readonly updatingEntrega = signal<boolean>(false);

  // Modal de cancelación de contrato
  readonly showCancelarModal = signal<boolean>(false);
  readonly contratoParaCancelar = signal<Contrato | null>(null);
  readonly cancelingContrato = signal<boolean>(false);

  readonly accionForm = this.fb.nonNullable.group({
    nuevaHora: [''],
  });

  readonly totalActivos = computed(
    () => this.contratos().filter((item) => item.estado === 0).length,
  );

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.svc
      .getContratos()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => {
          const sorted = [...(data ?? [])].sort((a, b) => b.updateAt.localeCompare(a.updateAt));
          this.contratos.set(sorted);
        },
        error: (err) => {
          this.contratos.set([]);
          this.toast.error(err?.message ?? 'No se pudo cargar contratos.');
        },
      });
  }

  estadoLabel(estado: number): string {
    return CONTRATO_ESTADO_MAP[estado] ?? `Estado ${estado}`;
  }

  estadoClass(estado: number): string {
    if (estado === 0) return 'count-badge estado-activo';
    if (estado === 1) return 'count-badge estado-cancelado';
    if (estado === 2) return 'count-badge estado-finalizado';
    return 'count-badge';
  }

  openEntregasModal(contrato: Contrato): void {
    this.contratoSeleccionado.set(contrato);
    this.showEntregasModal.set(true);
    this.loadingEntregas.set(true);
    this.entregasCalendario.set([]);

    this.svc
      .getCalendarioEntregas(contrato.id)
      .pipe(finalize(() => this.loadingEntregas.set(false)))
      .subscribe({
        next: (data) => {
          const sorted = [...(data ?? [])].sort((a, b) => b.fecha.localeCompare(a.fecha));
          this.entregasCalendario.set(sorted);
        },
        error: (err) => {
          this.entregasCalendario.set([]);
          this.toast.error(err?.message ?? 'No se pudo cargar entregas del contrato.');
        },
      });
  }

  closeEntregasModal(): void {
    this.showEntregasModal.set(false);
    this.loadingEntregas.set(false);
    this.contratoSeleccionado.set(null);
    this.entregasCalendario.set([]);
  }

  estadoEntregaLabel(estado: number): string {
    return ENTREGA_ESTADO_MAP[estado] ?? `Estado ${estado}`;
  }

  estadoEntregaClass(estado: number): string {
    if (estado === 0) return 'count-badge entrega-pendiente';
    if (estado === 1) return 'count-badge entrega-reprogramado';
    if (estado === 2) return 'count-badge entrega-entregado';
    if (estado === 3) return 'count-badge entrega-cancelado';
    return 'count-badge';
  }

  openAccionModal(entrega: EntregaCalendario, accion: AccionEntrega): void {
    this.entregaSeleccionada.set(entrega);
    this.accionSeleccionada.set(accion);
    this.accionForm.reset({ nuevaHora: accion === 'cambiar-hora' ? entrega.hora : '' });
    this.showAccionModal.set(true);
  }

  closeAccionModal(): void {
    this.showAccionModal.set(false);
    this.accionSeleccionada.set(null);
    this.entregaSeleccionada.set(null);
    this.accionForm.reset();
  }

  confirmarAccion(): void {
    const entrega = this.entregaSeleccionada();
    const accion = this.accionSeleccionada();
    if (!entrega || !accion) return;

    this.updatingEntrega.set(true);

    let dto: ActualizarCalendarioEntregaDto;

    if (accion === 'cambiar-hora') {
      dto = {
        nuevaHora: this.accionForm.value.nuevaHora || entrega.hora,
        reprogramarFecha: false,
        cancelar: false,
      };
    } else if (accion === 'reprogramar') {
      dto = {
        nuevaHora: null,
        reprogramarFecha: true,
        cancelar: false,
      };
    } else {
      dto = {
        nuevaHora: null,
        reprogramarFecha: false,
        cancelar: true,
      };
    }

    this.svc
      .actualizarCalendarioEntrega(entrega.id, dto)
      .pipe(finalize(() => this.updatingEntrega.set(false)))
      .subscribe({
        next: () => {
          const accionLabel =
            accion === 'cambiar-hora'
              ? 'Hora actualizada'
              : accion === 'reprogramar'
                ? 'Entrega reprogramada'
                : 'Entrega cancelada';
          this.toast.success(accionLabel + ' correctamente.');
          this.closeAccionModal();
          this.cargarEntregasDelContratoActual();
        },
        error: (err) => {
          this.toast.error(err?.message ?? 'No se pudo actualizar la entrega.');
        },
      });
  }

  private cargarEntregasDelContratoActual(): void {
    const contrato = this.contratoSeleccionado();
    if (contrato) {
      this.openEntregasModal(contrato);
    }
  }

  openCancelarContratoModal(contrato: Contrato): void {
    this.contratoParaCancelar.set(contrato);
    this.showCancelarModal.set(true);
  }

  closeCancelarContratoModal(): void {
    this.showCancelarModal.set(false);
    this.contratoParaCancelar.set(null);
  }

  confirmarCancelarContrato(): void {
    const contrato = this.contratoParaCancelar();
    if (!contrato) return;

    this.cancelingContrato.set(true);

    this.svc
      .cancelarContrato(contrato.id)
      .pipe(finalize(() => this.cancelingContrato.set(false)))
      .subscribe({
        next: () => {
          this.toast.success('Contrato cancelado correctamente.');
          this.closeCancelarContratoModal();
          this.load();
        },
        error: (err) => {
          this.toast.error(err?.message ?? 'No se pudo cancelar el contrato.');
        },
      });
  }

}



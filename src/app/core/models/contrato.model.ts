export interface Contrato {
  id: string;
  pacienteId: string;
  suscripcionId: string;
  planId: string;
  hora: string;
  inicio: string;
  fin: string;
  incluyeFinDeSemana: boolean;
  cantidadEntregas: number;
  precioTotal: number;
  estado: number;
  politicaCancelacionDias: number;
  updateAt: string;
}

export interface ContratoEnvelope {
  value: Contrato[];
  isSuccess: boolean;
  isFailure: boolean;
  error?: {
    code?: string;
    description?: string;
    structuredMessage?: string;
    type?: number;
  } | null;
}

export interface EntregaCalendario {
  id: string;
  contratoId: string;
  fecha: string;
  hora: string;
  estado: number;
  updateAt: string | null;
}

export interface EntregaCalendarioEnvelope {
  value: EntregaCalendario[];
  isSuccess: boolean;
  isFailure: boolean;
  error?: {
    code?: string;
    description?: string;
    structuredMessage?: string;
    type?: number;
  } | null;
}

export const CONTRATO_ESTADO_MAP: Record<number, string> = {
  0: 'Activo',
  1: 'Cancelado',
  2: 'Finalizado',
};

export const ENTREGA_ESTADO_MAP: Record<number, string> = {
  0: 'Programado',
  1: 'Reprogramado',
  2: 'Entregado',
  3: 'Cancelado',
};

export interface ActualizarCalendarioEntregaDto {
  nuevaHora: string | null;
  reprogramarFecha: boolean;
  cancelar: boolean;
  entregaId?: string;
  hoyOverride?: string | null;
}

export type AccionEntrega = 'cambiar-hora' | 'reprogramar' | 'cancelar';



export interface Producto {
  id: string;
  sku: string;
  nombre?: string;
  price: number;
  specialPrice?: number;
  special_price?: number;
  [k: string]: unknown;
}

export interface CreateProductoDto {
  sku: string;
  price: number;
  specialPrice?: number;
}

export interface Paquete {
  id: string;
  [k: string]: unknown;
}

export interface Suscripcion {
  id: string;
  [k: string]: unknown;
}

export interface Calendario {
  id: string;
  [k: string]: unknown;
}

export interface PacienteProd {
  id: string;
  [k: string]: unknown;
}

export interface GenerarOrdenDto {
  id?: string | null;
  fecha: string;
  items: { sku: string; qty: number }[];
}

// ── Agenda ────────────────────────────────────────────────────────────────────
export interface AgendaEntrada {
  calendario_id: string;
  estado: number;
  entrega_id: string;
  contrato_id: string;
  paciente: { id: string; nombre: string; documento: string };
  suscripcion: { id: string; nombre: string };
  ventana_entrega: { id: string; desde: string; hasta: string };
}
export type AgendaResponse = Record<string, AgendaEntrada[]>;

// ── Órdenes consolidadas ──────────────────────────────────────────────────────
export interface OrdenConsolidadaItem {
  qty: number;
  price: number;
  producto: { sku: string; nombre: string };
}
export interface OrdenConsolidadaBatch {
  cant_planificada: number;
  cant_producida: number;
  estado: string;
}
export interface OrdenConsolidadaDespacho {
  delivery_status: string;
  paciente_id: string;
  tracking: { historial: unknown[] };
}
export interface OrdenConsolidadaProgreso {
  total_paquetes: number;
  completados: number;
  pendientes: number;
}
export interface OrdenConsolidada {
  id: string;
  fecha: string;
  estado: string;
  entrega_completada_at: string | null;
  items: OrdenConsolidadaItem[];
  batches: OrdenConsolidadaBatch[];
  despacho: OrdenConsolidadaDespacho[];
  progreso_entrega: OrdenConsolidadaProgreso;
}
export interface SuscripcionOrdenes {
  suscripcion: { id: string; nombre: string };
  ordenes: OrdenConsolidada[];
}

export type OrdenAccion = 'generar' | 'planificar' | 'procesar' | 'despachar';

export const ORDEN_ACCION_MAP: Record<
  OrdenAccion,
  { label: string; cssClass: string; icon: string; description: string }
> = {
  generar: {
    label: 'Generar',
    cssClass: 'badge-creada',
    icon: 'bi-file-earmark-plus',
    description: 'Crear una orden de producción a partir de items.',
  },
  planificar: {
    label: 'Planificar',
    cssClass: 'badge-planificada',
    icon: 'bi-diagram-3',
    description: 'Preparar lotes y recursos.',
  },
  procesar: {
    label: 'Procesar',
    cssClass: 'badge-en-proceso',
    icon: 'bi-gear-wide-connected',
    description: 'Cocinar y empacar.',
  },
  despachar: {
    label: 'Despachar',
    cssClass: 'badge-despachada',
    icon: 'bi-truck',
    description: 'Enviar a distribución.',
  },
};

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
  contrato_id: string | null;
  paciente: { id: string; nombre: string; documento: string } | null;
  suscripcion: { id: string; nombre: string } | null;
  ventana_entrega: { id: string; desde: string; hasta: string } | null;
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
export interface TrackingEvento {
  event_id?: string;
  status?: string;
  estado?: string;
  driver_id?: string;
  occurred_on?: string;
  timestamp?: string;
  fecha?: string;
  nota?: string;
  [k: string]: unknown;
}
export interface DespachoTracking {
  status: string;
  completed_at: string | null;
  driver_id: string | null;
  foto_url?: string | null;
  incident_type: string | null;
  incident_description: string | null;
  historial: TrackingEvento[];
}
export interface DespachoRuta {
  origen: { lat: number; lng: number };
  destino: { lat: number; lng: number };
}
export interface DespachoDireccion {
  id: string;
  linea1: string;
  linea2: string | null;
  ciudad: string;
  provincia: string;
  pais: string;
  geo?: { lat: number; lng: number };
}
export interface OrdenConsolidadaDespacho {
  id?: string;
  delivery_status: string;
  delivery_occurred_on?: string | null;
  driver_id?: string | null;
  paquete_id?: string | null;
  entrega_id?: string | null;
  contrato_id?: string | null;
  paciente_id?: string;
  paciente?: { id: string; nombre: string; documento: string } | null;
  direccion_id?: string;
  direccion?: DespachoDireccion | null;
  ventana_entrega_id?: string | null;
  ruta?: DespachoRuta | null;
  tracking: DespachoTracking | null;
}
export interface OrdenConsolidadaProgreso {
  total_paquetes: number;
  completados: number;
  pendientes: number;
  completado_at?: string | null;
  entrega_id?: string;
  contrato_id?: string | null;
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

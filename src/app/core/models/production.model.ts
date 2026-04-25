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

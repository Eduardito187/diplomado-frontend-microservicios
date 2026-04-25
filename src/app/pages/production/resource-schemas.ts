import { ProductionResourceKey } from '../../core/services/production.service';

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'integer'
  | 'date'
  | 'datetime'
  | 'uuid'
  | 'json';

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  min?: number;
  max?: number;
  maxLength?: number;
}

export interface ResourceSchema {
  key: ProductionResourceKey;
  label: string;
  icon: string;
  singular: string;
  fields: FieldDef[];
  primaryColumns: string[];
}

export const RESOURCE_SCHEMAS: Record<ProductionResourceKey, ResourceSchema> = {
  productos: {
    key: 'productos',
    label: 'Productos',
    icon: 'bi-box-seam',
    singular: 'producto',
    primaryColumns: ['nombre', 'sku', 'price'],
    fields: [
      { name: 'sku', label: 'SKU', type: 'text', required: true, maxLength: 150, placeholder: 'ALM-001' },
      { name: 'nombre', label: 'Nombre', type: 'text', maxLength: 150, placeholder: 'Almuerzo bajo en sodio', hint: 'Opcional' },
      { name: 'price', label: 'Precio', type: 'number', required: true, min: 0, placeholder: '0.00' },
      { name: 'specialPrice', label: 'Precio especial', type: 'number', required: true, min: 0, placeholder: '0.00' },
    ],
  },
  paquetes: {
    key: 'paquetes',
    label: 'Paquetes',
    icon: 'bi-boxes',
    singular: 'paquete',
    primaryColumns: ['etiquetaId', 'ventanaId', 'direccionId'],
    fields: [
      { name: 'etiquetaId', label: 'Etiqueta', type: 'uuid', hint: 'UUID de etiqueta existente' },
      { name: 'ventanaId', label: 'Ventana de entrega', type: 'uuid', hint: 'UUID de ventana de entrega' },
      { name: 'direccionId', label: 'Dirección', type: 'uuid', hint: 'UUID de dirección' },
    ],
  },
  etiquetas: {
    key: 'etiquetas',
    label: 'Etiquetas',
    icon: 'bi-tags',
    singular: 'etiqueta',
    primaryColumns: ['suscripcionId', 'pacienteId'],
    fields: [
      { name: 'suscripcionId', label: 'Suscripción', type: 'uuid', hint: 'UUID de suscripción' },
      { name: 'pacienteId', label: 'Paciente', type: 'uuid', hint: 'UUID de paciente' },
      { name: 'qrPayload', label: 'QR payload', type: 'json', hint: 'Objeto o array JSON' },
    ],
  },
  porciones: {
    key: 'porciones',
    label: 'Porciones',
    icon: 'bi-cup-hot',
    singular: 'porción',
    primaryColumns: ['nombre', 'pesoGr'],
    fields: [
      { name: 'nombre', label: 'Nombre', type: 'text', required: true, maxLength: 150, placeholder: 'Porción chica' },
      { name: 'pesoGr', label: 'Peso (gramos)', type: 'integer', required: true, min: 1, placeholder: '250' },
    ],
  },
  ventanasEntrega: {
    key: 'ventanasEntrega',
    label: 'Ventanas de entrega',
    icon: 'bi-clock-history',
    singular: 'ventana de entrega',
    primaryColumns: ['desde', 'hasta'],
    fields: [
      { name: 'desde', label: 'Desde', type: 'datetime', required: true },
      { name: 'hasta', label: 'Hasta', type: 'datetime', required: true, hint: 'Debe ser posterior a "desde" (incluye hora)' },
    ],
  },
};

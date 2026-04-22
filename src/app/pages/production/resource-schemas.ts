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
    primaryColumns: ['sku', 'price', 'specialPrice'],
    fields: [
      { name: 'sku', label: 'SKU', type: 'text', required: true, maxLength: 150, placeholder: 'PROD-001' },
      { name: 'price', label: 'Precio', type: 'number', required: true, min: 0, placeholder: '0.00' },
      { name: 'specialPrice', label: 'Precio especial', type: 'number', min: 0, hint: 'Opcional' },
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
  recetas: {
    key: 'recetas',
    label: 'Recetas (cocina)',
    icon: 'bi-egg-fried',
    singular: 'receta',
    primaryColumns: ['nombre', 'totalCalories', 'description'],
    fields: [
      { name: 'nombre', label: 'Nombre', type: 'text', maxLength: 150, placeholder: 'Receta de quinua' },
      { name: 'description', label: 'Descripción', type: 'textarea' },
      { name: 'instructions', label: 'Instrucciones', type: 'textarea' },
      { name: 'totalCalories', label: 'Calorías totales', type: 'integer', min: 0 },
      { name: 'nutrientes', label: 'Nutrientes', type: 'json', hint: 'Array JSON — ej. [{"name":"proteina","value":20}]' },
      { name: 'ingredientes', label: 'Ingredientes', type: 'json', hint: 'Array JSON' },
    ],
  },
  suscripciones: {
    key: 'suscripciones',
    label: 'Suscripciones',
    icon: 'bi-bookmark-star',
    singular: 'suscripción',
    primaryColumns: ['nombre'],
    fields: [
      { name: 'nombre', label: 'Nombre', type: 'text', required: true, maxLength: 150, placeholder: 'Plan semanal' },
    ],
  },
  calendarios: {
    key: 'calendarios',
    label: 'Calendarios',
    icon: 'bi-calendar3',
    singular: 'calendario',
    primaryColumns: ['fecha'],
    fields: [
      { name: 'fecha', label: 'Fecha', type: 'date', required: true },
    ],
  },
  calendarioItems: {
    key: 'calendarioItems',
    label: 'Calendario items',
    icon: 'bi-calendar-event',
    singular: 'item de calendario',
    primaryColumns: ['calendarioId', 'itemDespachoId'],
    fields: [
      { name: 'calendarioId', label: 'Calendario', type: 'uuid', required: true, hint: 'UUID de calendario existente' },
      { name: 'itemDespachoId', label: 'Item de despacho', type: 'uuid', required: true, hint: 'UUID de item de despacho' },
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
  direcciones: {
    key: 'direcciones',
    label: 'Direcciones',
    icon: 'bi-geo-alt',
    singular: 'dirección',
    primaryColumns: ['linea1', 'ciudad', 'pais'],
    fields: [
      { name: 'nombre', label: 'Nombre', type: 'text', maxLength: 150, placeholder: 'Casa / Oficina' },
      { name: 'linea1', label: 'Línea 1', type: 'text', required: true, maxLength: 255, placeholder: 'Calle principal #123' },
      { name: 'linea2', label: 'Línea 2', type: 'text', maxLength: 255, placeholder: 'Depto / piso' },
      { name: 'ciudad', label: 'Ciudad', type: 'text', maxLength: 150 },
      { name: 'provincia', label: 'Provincia', type: 'text', maxLength: 150 },
      { name: 'pais', label: 'País', type: 'text', maxLength: 150 },
      { name: 'geo', label: 'Geo', type: 'json', hint: 'Objeto { lat, lng } opcional' },
    ],
  },
  pacientes: {
    key: 'pacientes',
    label: 'Pacientes',
    icon: 'bi-people-fill',
    singular: 'paciente',
    primaryColumns: ['nombre', 'documento'],
    fields: [
      { name: 'nombre', label: 'Nombre', type: 'text', required: true, maxLength: 150, placeholder: 'Nombre y apellidos' },
      { name: 'documento', label: 'Documento', type: 'text', maxLength: 100, placeholder: 'CI / DNI' },
      { name: 'suscripcionId', label: 'Suscripción', type: 'uuid', hint: 'UUID de suscripción existente' },
    ],
  },
};

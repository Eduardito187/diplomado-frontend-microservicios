export interface Suscripcion {
  id: string;
  nombre: string;
  descripcion: string;
  cantidadDias: number;
  precioDia: number;
  updateAt: string | null;
}

export interface CrearSuscripcionDto {
  nombre: string;
  descripcion: string;
  cantidadDias: number;
  precioDia: number;
}

export interface ActualizarSuscripcionDto {
  nombre: string;
  descripcion: string;
  cantidadDias: number;
  precioDia: number;
}

export interface SuscripcionEnvelope {
  value: Suscripcion[];
  isSuccess: boolean;
  isFailure: boolean;
  error?: {
    code?: string;
    description?: string;
    structuredMessage?: string;
    type?: number;
  } | null;
}

export interface CrearSuscripcionEnvelope {
  value: string;
  isSuccess: boolean;
  isFailure: boolean;
  error?: {
    code?: string;
    description?: string;
    structuredMessage?: string;
    type?: number;
  } | null;
}

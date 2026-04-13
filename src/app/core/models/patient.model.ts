export interface Patient {
  id: string;
  name: string;
  lastname: string;
  birthDate?: string;
  email: string;
  cellphone?: string;
  document?: string;
  subscriptionId?: string;
  subscriptionStatus?: string;
  subscriptionEndsOn?: string;
  addresses?: Address[];
}

export interface Address {
  id: string;
  label?: string;
  line1: string;
  line2?: string;
  country?: string;
  province?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  active?: boolean;
}

export interface CreatePatientDto {
  name: string;
  lastname: string;
  birthDate?: string;
  email: string;
  cellphone?: string;
  document?: string;
  subscriptionId?: string | null;
}

export type UpdatePatientDto = CreatePatientDto;

export interface CreateAddressDto {
  label?: string;
  line1: string;
  line2?: string;
  country?: string;
  province?: string;
  city?: string;
  latitude?: number | null;
  longitude?: number | null;
}

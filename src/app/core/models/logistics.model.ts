export type DeliveryStatus =
  | 'Pending'
  | 'InTransit'
  | 'Completed'
  | 'Failed'
  | 'Cancelled';

export type IncidentType = 0 | 1 | 2 | 3 | 4;

export interface PackageDto {
  id: string;
  driverId: string;
  number: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  deliveryAddress: string;
  deliveryLatitude?: number | null;
  deliveryLongitude?: number | null;
  deliveryDate: string;
  deliveryEvidence?: string | null;
  deliveryOrder?: number | null;
  deliveryStatus: DeliveryStatus;
  incidentType?: string | number | null;
  incidentDescription?: string | null;
  updatedAt?: string;
}

export interface SetDeliveryOrderDto {
  packageId: string;
  deliveryOrder: number;
}

export interface PackageActionDto {
  packageId: string;
}

export interface MarkDeliveryCompletedDto {
  packageId: string;
  deliveryEvidence: string;
}

export interface RegisterDeliveryIncidentDto {
  packageId: string;
  incidentType: IncidentType | string;
  incidentDescription: string;
}

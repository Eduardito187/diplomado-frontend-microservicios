export const ROLES = {
  ADMIN: 'admin',
  NUTRITIONIST: 'nutritionist',
  PATIENT: 'patient',
  DRIVER: 'driver',
  COCINERO: 'cocinero',
  PLANIFICADOR: 'planificador',
  DESPACHADOR: 'despachador',
  PRODUCCION: 'produccion',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const SECTION_ROLES = {
  dashboard: [] as Role[],
  patients: [ROLES.ADMIN, ROLES.NUTRITIONIST],
  appointments: [ROLES.ADMIN, ROLES.NUTRITIONIST],
  production: [ROLES.ADMIN, ROLES.COCINERO, ROLES.PLANIFICADOR, ROLES.DESPACHADOR, ROLES.PRODUCCION],
  'meal-plans': [ROLES.ADMIN, ROLES.NUTRITIONIST, ROLES.PLANIFICADOR, ROLES.PRODUCCION],
  recipes: [ROLES.ADMIN, ROLES.NUTRITIONIST, ROLES.COCINERO, ROLES.PLANIFICADOR, ROLES.PRODUCCION],
  logistics: [ROLES.ADMIN, ROLES.DRIVER],
} as const;

export type SectionKey = keyof typeof SECTION_ROLES;

import { environment } from '../../../environments/environment';

export const GATEWAY_URL = environment.gatewayUrl;

const PATIENTS_DIRECT = environment.patientsDirectUrl;
const APPOINTMENTS_DIRECT = environment.appointmentsDirectUrl;
const MEAL_PLANS_DIRECT = environment.mealPlansDirectUrl;

const resource = (name: string) => ({
  base: `${GATEWAY_URL}/production/${name}`,
  byId: (id: string) => `${GATEWAY_URL}/production/${name}/${id}`,
});

export const API = {
  auth: {
    login: `${PATIENTS_DIRECT}/api/login`,
    refresh: `${PATIENTS_DIRECT}/api/refresh`,
  },

  patients: {
    base: `${GATEWAY_URL}/patients`,
    byId: (id: string) => `${GATEWAY_URL}/patients/${id}`,
    addresses: (id: string) => `${GATEWAY_URL}/patients/${id}/addresses`,
    addressById: (patientId: string, addressId: string) =>
      `${GATEWAY_URL}/patients/${patientId}/addresses/${addressId}`,
    addressGeo: (patientId: string, addressId: string) =>
      `${GATEWAY_URL}/patients/${patientId}/addresses/${addressId}/geo`,
  },

  appointments: {
    schedule: `${GATEWAY_URL}/appointment/schedule`,
    attend: `${GATEWAY_URL}/appointment/attend`,
    cancel: `${APPOINTMENTS_DIRECT}/api/appointment/cancel`,
    notAttended: `${APPOINTMENTS_DIRECT}/api/appointment/notattended`,
  },

  nutritionists: {
    base: `${GATEWAY_URL}/nutritionist`,
    appointmentsByDate: `${APPOINTMENTS_DIRECT}/api/nutritionist/appointments`,
  },

  production: {
    ordenes: {
      generar: `${GATEWAY_URL}/production/produccion/ordenes/generar`,
      planificar: `${GATEWAY_URL}/production/produccion/ordenes/planificar`,
      procesar: `${GATEWAY_URL}/production/produccion/ordenes/procesar`,
      despachar: `${GATEWAY_URL}/production/produccion/ordenes/despachar`,
    },
    productos: resource('productos'),
    paquetes: resource('paquetes'),
    recetas: resource('recetas'),
    suscripciones: resource('suscripciones'),
    calendarios: resource('calendarios'),
    calendarioItems: resource('calendario-items'),
    etiquetas: resource('etiquetas'),
    porciones: resource('porciones'),
    ventanasEntrega: resource('ventanas-entrega'),
    direcciones: resource('direcciones'),
    pacientes: resource('pacientes'),
  },

  mealPlans: {
    base: `${MEAL_PLANS_DIRECT}/meal-plans`,
    byId: (id: string) => `${MEAL_PLANS_DIRECT}/meal-plans/${id}`,
    cancel: (id: string) => `${MEAL_PLANS_DIRECT}/meal-plans/${id}/cancel`,
  },
  recipes: {
    base: `${MEAL_PLANS_DIRECT}/recipes`,
    byId: (id: string) => `${MEAL_PLANS_DIRECT}/recipes/${id}`,
  },
  ingredients: {
    base: `${MEAL_PLANS_DIRECT}/ingredients`,
    byId: (id: string) => `${MEAL_PLANS_DIRECT}/ingredients/${id}`,
  },
};

export interface ResultEnvelope<T> {
  success: boolean;
  value?: T;
  error?: { type?: string; message?: string; code?: string } | null;
}

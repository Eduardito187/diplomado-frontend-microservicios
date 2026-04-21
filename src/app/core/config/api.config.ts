import { environment } from '../../../environments/environment';

export const GATEWAY_URL = environment.gatewayUrl;

const KC = environment.keycloak;
export const KEYCLOAK = {
  tokenUrl: `${KC.url}/realms/${KC.realm}/protocol/openid-connect/token`,
  logoutUrl: `${KC.url}/realms/${KC.realm}/protocol/openid-connect/logout`,
  clientId: KC.clientId,
};

const resource = (name: string) => ({
  base: `${GATEWAY_URL}/production/${name}`,
  byId: (id: string) => `${GATEWAY_URL}/production/${name}/${id}`,
});

export const API = {
  auth: {
    login: KEYCLOAK.tokenUrl,
    refresh: KEYCLOAK.tokenUrl,
    logout: KEYCLOAK.logoutUrl,
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
    cancel: `${GATEWAY_URL}/appointment/cancel`,
    notAttended: `${GATEWAY_URL}/appointment/notattended`,
  },

  nutritionists: {
    base: `${GATEWAY_URL}/nutritionist`,
    appointmentsByDate: `${GATEWAY_URL}/nutritionist/appointments`,
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
    base: `${GATEWAY_URL}/meal-plans`,
    byId: (id: string) => `${GATEWAY_URL}/meal-plans/${id}`,
    cancel: (id: string) => `${GATEWAY_URL}/meal-plans/${id}/cancel`,
  },
  recipes: {
    base: `${GATEWAY_URL}/recipes`,
    byId: (id: string) => `${GATEWAY_URL}/recipes/${id}`,
  },
  ingredients: {
    base: `${GATEWAY_URL}/ingredients`,
    byId: (id: string) => `${GATEWAY_URL}/ingredients/${id}`,
  },
  logistics: {
    base: `${GATEWAY_URL}/logistics`,
    getPackage: `${GATEWAY_URL}/logistics/Package/getPackage`,
    getPackagesByDriverAndDate: `${GATEWAY_URL}/logistics/Package/getPackagesByDriverAndDeliveryDate`,
    setDeliveryOrder: `${GATEWAY_URL}/logistics/Package/setDeliveryOrder`,
    cancelDelivery: `${GATEWAY_URL}/logistics/Package/cancelDelivery`,
    markDeliveryFailed: `${GATEWAY_URL}/logistics/Package/markDeliveryFailed`,
    markDeliveryInTransit: `${GATEWAY_URL}/logistics/Package/markDeliveryInTransit`,
    markDeliveryCompleted: `${GATEWAY_URL}/logistics/Package/markDeliveryCompleted`,
    registerDeliveryIncident: `${GATEWAY_URL}/logistics/Package/registerDeliveryIncident`,
  },
};

export interface ResultEnvelope<T> {
  success: boolean;
  value?: T;
  error?: { type?: string; message?: string; code?: string } | null;
}

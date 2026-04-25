import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { roleGuard } from './core/guards/role-guard';
import { SECTION_ROLES } from './core/config/roles';
import { Presentation } from './pages/presentation/presentation';
import { Login } from './pages/login/login';
import { PublicLayout } from './pages/public/public-layout';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayout,
    children: [
      {
        path: '',
        component: Presentation,
        title: 'NurTriCenter | Nutrición a tu puerta',
      },
      {
        path: 'servicios',
        title: 'Servicios | NurTriCenter',
        loadComponent: () =>
          import('./pages/public/services-public').then((m) => m.ServicesPublic),
      },
      {
        path: 'nutricionistas',
        title: 'Nutricionistas | NurTriCenter',
        loadComponent: () =>
          import('./pages/public/team-public').then((m) => m.TeamPublic),
      },
      {
        path: 'nosotros',
        title: 'Nosotros | NurTriCenter',
        loadComponent: () =>
          import('./pages/public/about-public').then((m) => m.AboutPublic),
      },
      {
        path: 'contacto',
        title: 'Contacto | NurTriCenter',
        loadComponent: () =>
          import('./pages/public/contact-public').then((m) => m.ContactPublic),
      },
    ],
  },
  {
    path: 'login',
    component: Login,
    title: 'Iniciar Sesión | NurTriCenter',
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/admin/admin-layout').then((m) => m.AdminLayout),
    children: [
      { path: '', redirectTo: 'contratos-suscripciones', pathMatch: 'full' },
      {
        path: 'dashboard',
        title: 'Dashboard | NurTriCenter',
        loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'patients',
        title: 'Pacientes | NurTriCenter',
        canActivate: [roleGuard(SECTION_ROLES.patients)],
        loadComponent: () => import('./pages/patients/patients').then((m) => m.Patients),
      },
      {
        path: 'appointments',
        title: 'Citas | NurTriCenter',
        canActivate: [roleGuard(SECTION_ROLES.appointments)],
        loadComponent: () =>
          import('./pages/appointments/appointments').then((m) => m.Appointments),
      },
      {
        path: 'production',
        title: 'Producción | NurTriCenter',
        canActivate: [roleGuard(SECTION_ROLES.production)],
        loadComponent: () => import('./pages/production/production').then((m) => m.Production),
      },
      {
        path: 'meal-plans',
        title: 'Planes de Comida | NurTriCenter',
        canActivate: [roleGuard(SECTION_ROLES['meal-plans'])],
        loadComponent: () => import('./pages/meal-plans/meal-plans').then((m) => m.MealPlans),
      },
      {
        path: 'contratos-suscripciones',
        title: 'Contratos y Suscripciones | NurTriCenter',
        loadComponent: () =>
          import('./pages/contratos-suscripciones/contratos-suscripciones').then(
            (m) => m.ContratosSuscripciones,
          ),
      },
      {
        path: 'suscripciones',
        title: 'Suscripciones | NurTriCenter',
        loadComponent: () =>
          import('./pages/suscripciones/suscripciones').then((m) => m.Suscripciones),
      },
      {
        path: 'recipes',
        title: 'Recetas | NurTriCenter',
        canActivate: [roleGuard(SECTION_ROLES.recipes)],
        loadComponent: () => import('./pages/recipes/recipes-ingredients').then((m) => m.RecipesIngredients),
      },
      {
        path: 'logistics',
        title: 'Logística | NurTriCenter',
        canActivate: [roleGuard(SECTION_ROLES.logistics)],
        loadComponent: () => import('./pages/logistics/logistics').then((m) => m.Logistics),
      },
    ],
  },
  {
    path: 'home',
    redirectTo: '/admin/contratos-suscripciones',
    pathMatch: 'full',
  },
  {
    path: 'error',
    redirectTo: 'error/500',
    pathMatch: 'full',
  },
  {
    path: 'error/:code',
    title: 'Error | NurTriCenter',
    loadComponent: () => import('./pages/error/error').then((m) => m.ErrorPage),
  },
  {
    path: '**',
    redirectTo: 'error/404',
  },
];











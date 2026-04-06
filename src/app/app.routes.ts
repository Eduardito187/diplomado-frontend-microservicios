import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Presentation } from './pages/presentation/presentation';

export const routes: Routes = [
    {
        path: '',
        component: Presentation,
        title: 'Presentacion | Frontend Microservicios'
    },
    {
        path: 'login',
        component: Login,
        title: 'Login | Frontend Microservicios'
    },
    {
        path: 'home',
        component: Home,
        canActivate: [authGuard],
        title: 'Home | Frontend Microservicios'
    },
    {
        path: '**',
        redirectTo: ''
    }
];

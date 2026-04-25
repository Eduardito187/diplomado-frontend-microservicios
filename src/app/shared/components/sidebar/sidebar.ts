import { Component, computed, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { Role, SECTION_ROLES } from '../../../core/config/roles';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  color: string;
  roles: readonly Role[];
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  readonly isOpen = input<boolean>(true);
  readonly close = output<void>();

  private readonly allNavItems: NavItem[] = [
    {
      label: 'Dashboard',
      icon: 'bi-grid-1x2-fill',
      route: '/admin/dashboard',
      color: '#2f4f87',
      roles: SECTION_ROLES.dashboard,
    },
    {
      label: 'Contratos y Suscripciones',
      icon: 'bi-file-earmark-text-fill',
      route: '/admin/contratos-suscripciones',
      color: '#1d4ed8',
      roles: [],
    },
    {
      label: 'Suscripciones',
      icon: 'bi-journal-text',
      route: '/admin/suscripciones',
      color: '#0f766e',
      roles: [],
    },
    {
      label: 'Pacientes',
      icon: 'bi-people-fill',
      route: '/admin/patients',
      color: '#0891b2',
      roles: SECTION_ROLES.patients,
    },
    {
      label: 'Citas',
      icon: 'bi-calendar2-check-fill',
      route: '/admin/appointments',
      color: '#0f766e',
      roles: SECTION_ROLES.appointments,
    },
    {
      label: 'Producción',
      icon: 'bi-box-seam-fill',
      route: '/admin/production',
      color: '#b45309',
      roles: SECTION_ROLES.production,
    },
    {
      label: 'Planes de Comida',
      icon: 'bi-clipboard2-heart-fill',
      route: '/admin/meal-plans',
      color: '#15803d',
      roles: SECTION_ROLES['meal-plans'],
    },
    {
      label: 'Recetas',
      icon: 'bi-journal-bookmark-fill',
      route: '/admin/recipes',
      color: '#7c3aed',
      roles: SECTION_ROLES.recipes,
    },
    {
      label: 'Logística',
      icon: 'bi-truck',
      route: '/admin/logistics',
      color: '#0f766e',
      roles: SECTION_ROLES.logistics,
    },
  ];

  readonly navItems = computed(() =>
    this.allNavItems.filter(
      (item) => item.roles.length === 0 || this.auth.hasAnyRole(item.roles)
    )
  );

  constructor(readonly auth: Auth) {}

  onClose(): void {
    this.close.emit();
  }

  logout(): void {
    this.auth.logout();
  }

  get user() {
    return this.auth.getCurrentUser();
  }

  get userInitials(): string {
    const u = this.user;
    if (!u) return 'U';
    const name = u.name ?? u.username ?? '';
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }
}











import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Auth } from '../../../core/services/auth';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  color: string;
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

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'bi-grid-1x2-fill', route: '/admin/dashboard', color: '#2f4f87' },
    { label: 'Pacientes', icon: 'bi-people-fill', route: '/admin/patients', color: '#0891b2' },
    {
      label: 'Citas',
      icon: 'bi-calendar2-check-fill',
      route: '/admin/appointments',
      color: '#0f766e',
    },
    {
      label: 'Producción',
      icon: 'bi-box-seam-fill',
      route: '/admin/production',
      color: '#b45309',
    },
    {
      label: 'Planes de Comida',
      icon: 'bi-clipboard2-heart-fill',
      route: '/admin/meal-plans',
      color: '#15803d',
    },
    {
      label: 'Recetas',
      icon: 'bi-journal-bookmark-fill',
      route: '/admin/recipes',
      color: '#7c3aed',
    },
    {
      label: 'Logística',
      icon: 'bi-truck',
      route: '/admin/logistics',
      color: '#0f766e',
    },
  ];

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

import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../../shared/components/sidebar/sidebar';
import { Topbar } from '../../shared/components/topbar/topbar';
import { ToastComponent } from '../../shared/components/toast/toast';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, Sidebar, Topbar, ToastComponent],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
})
export class AdminLayout {
  readonly sidebarOpen = signal<boolean>(false);
  pageTitle = 'Dashboard';
  pageSubtitle = '';

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }
}

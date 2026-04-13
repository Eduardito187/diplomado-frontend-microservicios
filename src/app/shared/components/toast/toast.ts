import { Component } from '@angular/core';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
})
export class ToastComponent {
  constructor(readonly toastService: ToastService) {}

  get toasts() {
    return this.toastService.toasts();
  }

  dismiss(toast: Toast): void {
    this.toastService.remove(toast.id);
  }

  iconFor(type: Toast['type']): string {
    const map = {
      success: 'bi-check-circle-fill',
      error: 'bi-x-circle-fill',
      warning: 'bi-exclamation-triangle-fill',
      info: 'bi-info-circle-fill',
    };
    return map[type];
  }
}

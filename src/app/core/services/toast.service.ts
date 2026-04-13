import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
  duration: number;
}

let _id = 0;

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  private add(type: ToastType, message: string, duration = 4000): void {
    const toast: Toast = { id: ++_id, type, message, duration };
    this.toasts.update((list) => [...list, toast]);
    setTimeout(() => this.remove(toast.id), duration);
  }

  success(message: string): void {
    this.add('success', message);
  }

  error(message: string): void {
    this.add('error', message, 6000);
  }

  warning(message: string): void {
    this.add('warning', message);
  }

  info(message: string): void {
    this.add('info', message);
  }

  remove(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}

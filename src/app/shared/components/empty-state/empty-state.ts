import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  template: `
    <div class="empty-state">
      <div class="empty-icon">
        <i class="bi {{ icon() }}"></i>
      </div>
      <h3 class="empty-title">{{ title() }}</h3>
      <p class="empty-desc">{{ description() }}</p>
      @if (actionLabel()) {
        <button class="btn btn-brand" (click)="action.emit()">
          <i class="bi bi-plus-lg me-2"></i>{{ actionLabel() }}
        </button>
      }
    </div>
  `,
  styles: [`
    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
    }
    .empty-icon {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.25rem;
      i { font-size: 1.8rem; color: #94a3b8; }
    }
    .empty-title {
      font-size: 1rem;
      font-weight: 700;
      color: #1f2f45;
      margin: 0;
    }
    .empty-desc {
      font-size: 0.85rem;
      color: #6b7280;
      margin: 0;
      max-width: 280px;
      line-height: 1.5;
    }
  `],
})
export class EmptyState {
  readonly title = input<string>('Sin resultados');
  readonly description = input<string>('No hay elementos para mostrar.');
  readonly icon = input<string>('bi-inbox');
  readonly actionLabel = input<string>('');
  readonly action = output<void>();
}

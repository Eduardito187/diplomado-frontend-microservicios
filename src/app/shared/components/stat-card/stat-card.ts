import { Component, input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  templateUrl: './stat-card.html',
  styleUrl: './stat-card.scss',
})
export class StatCard {
  readonly label = input.required<string>();
  readonly value = input<string | number>('—');
  readonly icon = input<string>('bi-bar-chart-fill');
  readonly color = input<string>('#2f4f87');
  readonly trend = input<string>('');
  readonly trendUp = input<boolean>(true);
  readonly loading = input<boolean>(false);
  readonly sublabel = input<string>('');
}

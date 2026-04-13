import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
})
export class Topbar {
  readonly pageTitle = input<string>('Dashboard');
  readonly pageSubtitle = input<string>('');
  readonly menuToggle = output<void>();

  onMenuToggle(): void {
    this.menuToggle.emit();
  }
}

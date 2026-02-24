import { Component, inject, signal } from '@angular/core';
import { LayoutShell } from './shared/layout-shell/layout-shell';
import { ThemeService } from './shared/theme.service';

@Component({
  selector: 'app-root',
  imports: [LayoutShell],
  template: '<app-layout-shell />',
  styleUrl: './app.css'
})
export class App {
  private readonly themeService = inject(ThemeService);
  protected readonly title = signal('Ng-Test-Fe');

  public constructor() {
    this.themeService.initializeTheme();
  }
}

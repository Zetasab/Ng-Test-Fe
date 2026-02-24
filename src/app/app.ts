import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
  styleUrl: './app.css'
})
export class App {
  private readonly themeService = inject(ThemeService);
  protected readonly title = signal('Ng-Test-Fe');

  public constructor() {
    this.themeService.initializeTheme();
  }
}

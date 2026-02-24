import { Injectable, signal } from '@angular/core';

export type AppTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'app-theme';
const DARK_THEME_CLASS = 'app-dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  public readonly currentTheme = signal<AppTheme>('light');

  public readonly isDarkMode = signal(false);

  public initializeTheme(): void {
    const storedTheme = this.readStoredTheme();
    const theme = storedTheme ?? this.getSystemTheme();

    this.applyTheme(theme);
  }

  public toggleTheme(): void {
    const nextTheme: AppTheme = this.currentTheme() === 'dark' ? 'light' : 'dark';
    this.applyTheme(nextTheme);
  }

  private applyTheme(theme: AppTheme): void {
    this.currentTheme.set(theme);
    this.isDarkMode.set(theme === 'dark');
    localStorage.setItem(THEME_STORAGE_KEY, theme);

    const root = document.documentElement;
    root.classList.toggle(DARK_THEME_CLASS, theme === 'dark');
  }

  private readStoredTheme(): AppTheme | null {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);

    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme;
    }

    return null;
  }

  private getSystemTheme(): AppTheme {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
}

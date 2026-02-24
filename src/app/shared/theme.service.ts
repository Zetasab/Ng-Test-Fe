import { Injectable, signal } from '@angular/core';

export type AppTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'theme';
const DARK_THEME_CLASS = 'app-dark';
const LIGHT_THEME_CLASS = 'app-light';

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
    localStorage.setItem(
      THEME_STORAGE_KEY,
      theme === 'dark' ? DARK_THEME_CLASS : LIGHT_THEME_CLASS,
    );

    const root = document.documentElement;
    root.classList.toggle(LIGHT_THEME_CLASS, theme === 'light');
    root.classList.toggle(DARK_THEME_CLASS, theme === 'dark');
  }

  private readStoredTheme(): AppTheme | null {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);

    if (storedTheme === DARK_THEME_CLASS || storedTheme === 'dark') {
      return 'dark';
    }

    if (storedTheme === LIGHT_THEME_CLASS || storedTheme === 'light') {
      return 'light';
    }

    const legacyStoredTheme = localStorage.getItem('app-theme');

    if (legacyStoredTheme === 'dark' || legacyStoredTheme === DARK_THEME_CLASS) {
      return 'dark';
    }

    if (legacyStoredTheme === 'light' || legacyStoredTheme === LIGHT_THEME_CLASS) {
      return 'light';
    }

    return null;
  }

  private getSystemTheme(): AppTheme {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
}

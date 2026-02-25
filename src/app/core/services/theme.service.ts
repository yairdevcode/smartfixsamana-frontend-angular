import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'theme-dark' | 'theme-light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'smartfix-theme';
  private readonly themeSignal = signal<Theme>(this.getStoredTheme());

  constructor() {
    effect(() => {
      const theme = this.themeSignal();
      document.body.classList.remove('theme-dark', 'theme-light');
      document.body.classList.add(theme);
      localStorage.setItem(this.STORAGE_KEY, theme);
    });
  }

  get currentTheme(): Theme {
    return this.themeSignal();
  }

  isDark(): boolean {
    return this.themeSignal() === 'theme-dark';
  }

  toggleTheme(): void {
    this.themeSignal.set(this.themeSignal() === 'theme-dark' ? 'theme-light' : 'theme-dark');
  }

  private getStoredTheme(): Theme {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored === 'theme-light' ? 'theme-light' : 'theme-dark';
  }
}

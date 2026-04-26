import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _mode: ThemeMode = 'light';
  mode$ = new BehaviorSubject<ThemeMode>('light');

  constructor() {
    const saved = localStorage.getItem('theme') as ThemeMode | null;
    if (saved) {
      this.apply(saved);
    } else {
      // Respect system preference on first load
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.apply(prefersDark ? 'dark' : 'light');
    }
  }

  get mode(): ThemeMode { return this._mode; }
  get isDark(): boolean { return this._mode === 'dark'; }

  // Icon shows what you'll switch TO (conventional)
  get icon(): string { return this._mode === 'dark' ? '☀' : '☾'; }
  get label(): string { return this._mode === 'dark' ? 'Switch to light' : 'Switch to dark'; }

  toggle() {
    const next: ThemeMode = this._mode === 'dark' ? 'light' : 'dark';
    this.apply(next);
    localStorage.setItem('theme', next);
  }

  private apply(mode: ThemeMode) {
    this._mode = mode;
    this.mode$.next(mode);
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${mode}`);
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { Router } from '@angular/router';
import { NgxThemeToggleComponent } from '@omnedia/ngx-theme-toggle';
import { MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { AUTH_SESSION_KEY, USER_SESSION_KEY } from '../auth.guard';

@Component({
  selector: 'app-navbar',
  imports: [ToolbarModule, ButtonModule, BreadcrumbModule, NgxThemeToggleComponent],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar {
  private readonly router = inject(Router);

  public readonly isSidebarCollapsed = input(false);
  public readonly toggleSidebar = output<void>();

  protected readonly breadcrumbHome: MenuItem = {
    icon: 'pi pi-home',
    routerLink: '/',
  };

  protected readonly breadcrumbItems: MenuItem[] = [
    { label: 'Inicio', routerLink: '/' },
    { label: 'Dashboard', routerLink: '/' },
  ];

  protected onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  protected onLogout(): void {
    sessionStorage.removeItem(USER_SESSION_KEY);
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    void this.router.navigateByUrl('/login');
  }
}

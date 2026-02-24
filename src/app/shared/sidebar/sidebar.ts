import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';

@Component({
  selector: 'app-sidebar',
  imports: [MenuModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  protected readonly items: MenuItem[] = [
    {
      label: 'Inicio',
      icon: 'pi pi-home',
      routerLink: '/',
    },
    {
      label: 'Tags',
      icon: 'pi pi-tags',
      routerLink: '/',
    },
    {
      label: 'Perfil',
      icon: 'pi pi-user',
      routerLink: '/login',
    },
  ];
}

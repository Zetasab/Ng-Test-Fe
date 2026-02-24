import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { PanelMenuModule } from 'primeng/panelmenu';

@Component({
  selector: 'app-sidebar',
  imports: [PanelMenuModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  protected readonly items: MenuItem[] = [
    {
      label: 'Home',
      icon: 'pi pi-home',
      routerLink: '/',
    },
    {
      label: 'Games',
      icon: 'pi pi-th-large',
      expanded: true,
      items: [
        {
          label: 'Developer',
          icon: 'pi pi-code',
          routerLink: '/games/developer',
        },
        {
          label: 'Game',
          icon: 'pi pi-play-circle',
          routerLink: '/games/game',
        },
        {
          label: 'Game Search',
          icon: 'pi pi-search',
          routerLink: '/games/gamesearch',
        },
        {
          label: 'Genre',
          icon: 'pi pi-sitemap',
          routerLink: '/games/genre',
        },
        {
          label: 'Platform',
          icon: 'pi pi-desktop',
          routerLink: '/games/platform',
        },
        {
          label: 'Review',
          icon: 'pi pi-comment',
          routerLink: '/games/review',
        },
        {
          label: 'Tag',
          icon: 'pi pi-tags',
          routerLink: '/games/tag',
        },
      ],
    },
    {
      label: 'Users',
      icon: 'pi pi-users',
      routerLink: '/users',
    },
  ];
}

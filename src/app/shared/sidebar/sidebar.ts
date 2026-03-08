import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { PanelMenuModule } from 'primeng/panelmenu';
import { canDisplayRouteLink } from '../route-access.util';

@Component({
  selector: 'app-sidebar',
  imports: [PanelMenuModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  protected readonly items: MenuItem[] = this.filterMenuItems([
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
    {
      label: 'Audit',
      icon: 'pi pi-history',
      routerLink: '/audit',
    },
  ]);

  private filterMenuItems(items: readonly MenuItem[]): MenuItem[] {
    return items
      .map((item) => this.mapAllowedMenuItem(item))
      .filter((item): item is MenuItem => item !== null);
  }

  private mapAllowedMenuItem(item: MenuItem): MenuItem | null {
    const filteredChildren = item.items ? this.filterMenuItems(item.items) : undefined;
    const routePath = this.resolveRoutePath(item.routerLink);
    const hasRouteAccess = routePath ? canDisplayRouteLink(routePath) : true;

    if (!hasRouteAccess) {
      return null;
    }

    if (item.items && (!filteredChildren || filteredChildren.length === 0) && !routePath) {
      return null;
    }

    return {
      ...item,
      items: filteredChildren,
    };
  }

  private resolveRoutePath(routerLink: MenuItem['routerLink']): string | null {
    if (typeof routerLink === 'string') {
      return routerLink;
    }

    if (Array.isArray(routerLink)) {
      return routerLink.join('/');
    }

    return null;
  }
}

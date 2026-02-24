import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../navbar/navbar';
import { Sidebar } from '../sidebar/sidebar';

@Component({
  selector: 'app-layout-shell',
  imports: [Navbar, Sidebar, RouterOutlet],
  templateUrl: './layout-shell.html',
  styleUrl: './layout-shell.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutShell {
  protected readonly isSidebarCollapsed = signal(false);

  protected toggleSidebar(): void {
    this.isSidebarCollapsed.update((value) => !value);
  }
}

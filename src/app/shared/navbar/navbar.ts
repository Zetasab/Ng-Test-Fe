import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { NgxThemeToggleComponent } from '@omnedia/ngx-theme-toggle';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';

@Component({
  selector: 'app-navbar',
  imports: [ToolbarModule, ButtonModule, NgxThemeToggleComponent],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar {
  public readonly isSidebarCollapsed = input(false);
  public readonly toggleSidebar = output<void>();

  protected onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }
}

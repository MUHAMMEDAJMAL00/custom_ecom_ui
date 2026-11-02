import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { PlatformUser } from '../../core/models/auth.model';
import { AccentKey, ThemeMode, ThemeService } from '../../core/services/theme.service';
import { initials } from '../../core/utils/display.util';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  @Input() title = 'Dashboard';
  @Input() subtitle = '';
  @Input() user: PlatformUser | null = null;

  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  themeOpen = false;

  constructor(public theme: ThemeService) {}

  get accents() {
    return this.theme.accentOptions;
  }

  @HostListener('document:click')
  closeThemeMenu(): void {
    this.themeOpen = false;
  }

  @HostListener('document:keydown.escape')
  closeThemeMenuOnEscape(): void {
    this.themeOpen = false;
  }

  toggleThemeMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.themeOpen = !this.themeOpen;
  }

  setMode(mode: ThemeMode): void {
    this.theme.setMode(mode);
  }

  setAccent(accent: AccentKey): void {
    this.theme.setAccent(accent);
  }

  setCustomColor(color: string): void {
    this.theme.setCustomColor(color);
  }

  get avatarText(): string {
    return initials(this.user?.name);
  }

  get roleLabel(): string {
    if (this.user?.role_label) return this.user.role_label;
    return this.user?.role === 'platform_owner' ? 'Platform owner' : 'Platform support';
  }
}

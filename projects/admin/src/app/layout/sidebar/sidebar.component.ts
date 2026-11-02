import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PLATFORM_NAV, NavItem, NavSection } from '../nav-config';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  @Input() open = false;
  @Output() navigate = new EventEmitter<void>();

  readonly sections: NavSection[] = PLATFORM_NAV;

  constructor(public auth: AuthService) {}

  canSee(item: NavItem): boolean {
    if (item.path === '/platform/users' || item.path === '/platform/roles') {
      return this.auth.isPlatformOwner;
    }
    return true;
  }

  get primarySections(): NavSection[] {
    return this.sections.filter((section) => section.label !== 'Administration');
  }

  get adminSections(): NavSection[] {
    return this.sections.filter((section) => section.label === 'Administration');
  }
}

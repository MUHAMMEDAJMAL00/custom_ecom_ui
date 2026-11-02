import { Component, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthUser } from '../../core/models/auth.model';
import { AuthService } from '../../core/services/auth.service';
import { shopUrl } from '../../core/utils/shop-url';

// MySkin admin core/layout/header: branch switcher, fullscreen, settings, user menu.

@Component({
  selector: 'app-shop-header',
  standalone: false,
  templateUrl: './shop-header.component.html',
  styleUrl: './shop-header.component.css',
})
export class ShopHeaderComponent {
  @Output() toggleMobileSidebar = new EventEmitter<void>();
  @Output() logoutRequested = new EventEmitter<void>();

  userMenuOpen = false;

  constructor(private auth: AuthService, private router: Router, private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.userMenuOpen && !this.elementRef.nativeElement.contains(event.target)) {
      this.userMenuOpen = false;
    }
  }

  get user(): AuthUser | null {
    return this.auth.currentUser;
  }

  get stores() {
    return this.auth.stores;
  }

  get activeStoreId(): number | null {
    return this.auth.activeStoreId;
  }

  /** Switches the branch every page works in, then reloads so all data is for that branch. */
  switchStore(value: string): void {
    const id = parseInt(value, 10);
    if (!id || id === this.auth.activeStoreId) return;
    this.auth.setActiveStore(id);
    window.location.reload();
  }

  get initial(): string {
    const name = this.user?.name || this.user?.username || 'A';
    return name.charAt(0).toUpperCase();
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  closeUserMenu(): void {
    this.userMenuOpen = false;
  }

  toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => undefined);
    } else {
      document.exitFullscreen().catch(() => undefined);
    }
  }

  goToSettings(): void {
    this.closeUserMenu();
    void this.router.navigateByUrl(shopUrl('/settings'));
  }

  logout(): void {
    this.closeUserMenu();
    this.logoutRequested.emit();
  }
}

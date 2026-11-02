import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CustomerUser } from '../../core/models/customer.model';
import { CustomerAuthService } from '../../core/services/customer-auth.service';
import { ShopContextService } from '../../core/services/shop-context.service';

/** /account — profile details, password and shortcuts to orders, addresses and wishlist. */
@Component({
  selector: 'app-account-page',
  standalone: false,
  templateUrl: './account-page.component.html',
  styleUrls: ['./account-page.component.scss'],
})
export class AccountPageComponent implements OnInit {
  profile = {
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    postal_code: '',
  };
  password = { current_password: '', new_password: '', confirm_password: '' };

  savingProfile = false;
  savingPassword = false;
  profileError = '';
  profileSuccess = '';
  passwordError = '';
  passwordSuccess = '';
  wishlistEnabled = false;

  constructor(
    readonly auth: CustomerAuthService,
    private router: Router,
    private shop: ShopContextService,
  ) {}

  ngOnInit(): void {
    this.shop.load().subscribe((ctx) => (this.wishlistEnabled = ctx.bootstrap.features['wishlist'] === true));
    this.auth.user$.subscribe((user) => {
      if (user) this.fill(user);
    });
  }

  get initial(): string {
    return (this.profile.name || this.auth.user?.name || '?').charAt(0).toUpperCase();
  }

  saveProfile(): void {
    this.profileError = '';
    this.profileSuccess = '';
    if (!this.profile.name.trim()) {
      this.profileError = 'Your name is required.';
      return;
    }
    this.savingProfile = true;
    this.auth
      .updateProfile({
        name: this.profile.name.trim(),
        phone: this.profile.phone.trim() || null,
        address: this.profile.address.trim() || null,
        city: this.profile.city.trim() || null,
        state: this.profile.state.trim() || null,
        country: this.profile.country.trim() || null,
        postal_code: this.profile.postal_code.trim() || null,
      })
      .subscribe({
        next: () => {
          this.savingProfile = false;
          this.profileSuccess = 'Profile updated.';
        },
        error: (err: HttpErrorResponse) => {
          this.savingProfile = false;
          this.profileError = CustomerAuthService.errorMessage(err, 'Could not update your profile.');
        },
      });
  }

  changePassword(): void {
    this.passwordError = '';
    this.passwordSuccess = '';
    if (this.password.new_password.length < 6) {
      this.passwordError = 'New password must be at least 6 characters.';
      return;
    }
    if (this.password.new_password !== this.password.confirm_password) {
      this.passwordError = 'New passwords do not match.';
      return;
    }
    this.savingPassword = true;
    this.auth
      .changePassword(this.password.current_password, this.password.new_password, this.password.confirm_password)
      .subscribe({
        next: () => {
          this.savingPassword = false;
          this.password = { current_password: '', new_password: '', confirm_password: '' };
          this.passwordSuccess = 'Password changed. Other devices were signed out.';
        },
        error: (err: HttpErrorResponse) => {
          this.savingPassword = false;
          this.passwordError = CustomerAuthService.errorMessage(err, 'Could not change your password.');
        },
      });
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/']);
  }

  private fill(user: CustomerUser): void {
    this.profile = {
      name: user.name || '',
      phone: user.phone || '',
      address: user.address || '',
      city: user.city || '',
      state: user.state || '',
      country: user.country || 'India',
      postal_code: user.postal_code || '',
    };
  }
}

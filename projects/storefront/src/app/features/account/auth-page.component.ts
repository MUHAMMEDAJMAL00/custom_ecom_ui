import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerAuthService } from '../../core/services/customer-auth.service';

type Mode = 'login' | 'signup' | 'forgot';

/** /login, /signup and the three-step /forgot-password flow. */
@Component({
  selector: 'app-auth-page',
  standalone: false,
  templateUrl: './auth-page.component.html',
  styleUrls: ['./auth-page.component.scss'],
})
export class AuthPageComponent implements OnInit {
  mode: Mode = 'login';
  busy = false;
  error = '';
  success = '';

  loginForm = { email: '', password: '' };
  signupForm = { name: '', email: '', phone: '', password: '', confirm_password: '' };

  resetStep: 1 | 2 | 3 = 1;
  resetIdentifier = '';
  resetCode = '';
  resetToken = '';
  resetForm = { password: '', confirm_password: '' };

  returnUrl = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: CustomerAuthService,
  ) {}

  ngOnInit(): void {
    this.mode = (this.route.snapshot.data['mode'] as Mode) || 'login';
    this.returnUrl = this.safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
    if (this.auth.isLoggedIn && this.mode !== 'forgot') {
      void this.router.navigateByUrl(this.returnUrl || '/account');
    }
  }

  get title(): string {
    if (this.mode === 'signup') return 'Create your account';
    if (this.mode === 'forgot') return 'Reset your password';
    return 'Welcome back';
  }

  get subtitle(): string {
    if (this.mode === 'signup') return 'Save addresses, track orders and keep a wishlist.';
    if (this.mode === 'forgot') return 'We will email or text you a 6-digit code.';
    return 'Sign in to continue shopping and manage your orders.';
  }

  login(): void {
    this.error = '';
    if (!this.loginForm.email.trim() || !this.loginForm.password) {
      this.error = 'Enter your email and password.';
      return;
    }
    this.busy = true;
    this.auth.login(this.loginForm.email.trim(), this.loginForm.password).subscribe({
      next: () => {
        this.busy = false;
        void this.router.navigateByUrl(this.returnUrl || '/account');
      },
      error: (err: HttpErrorResponse) => {
        this.busy = false;
        this.error = CustomerAuthService.errorMessage(err, 'Could not sign you in.');
      },
    });
  }

  signup(): void {
    this.error = '';
    if (!this.signupForm.name.trim() || !this.signupForm.email.trim()) {
      this.error = 'Enter your name and email address.';
      return;
    }
    if (this.signupForm.password.length < 6) {
      this.error = 'Password must be at least 6 characters.';
      return;
    }
    if (this.signupForm.password !== this.signupForm.confirm_password) {
      this.error = 'Passwords do not match.';
      return;
    }
    this.busy = true;
    this.auth
      .signup({
        name: this.signupForm.name.trim(),
        email: this.signupForm.email.trim(),
        phone: this.signupForm.phone.trim() || undefined,
        password: this.signupForm.password,
        confirm_password: this.signupForm.confirm_password,
      })
      .subscribe({
        next: () => {
          this.busy = false;
          void this.router.navigateByUrl(this.returnUrl || '/account');
        },
        error: (err: HttpErrorResponse) => {
          this.busy = false;
          this.error = CustomerAuthService.errorMessage(err, 'Could not create your account.');
        },
      });
  }

  sendResetCode(): void {
    this.error = '';
    this.success = '';
    if (!this.resetIdentifier.trim()) {
      this.error = 'Enter your email address or mobile number.';
      return;
    }
    this.busy = true;
    this.auth.forgotPassword(this.resetIdentifier.trim()).subscribe({
      next: () => {
        this.busy = false;
        this.resetStep = 2;
        this.success = 'If an account exists, a 6-digit code is on its way.';
      },
      error: (err: HttpErrorResponse) => {
        this.busy = false;
        this.error = CustomerAuthService.errorMessage(err, 'Could not send the code.');
      },
    });
  }

  verifyCode(): void {
    this.error = '';
    if (!/^\d{6}$/.test(this.resetCode.trim())) {
      this.error = 'Enter the 6-digit code.';
      return;
    }
    this.busy = true;
    this.auth.verifyResetCode(this.resetIdentifier.trim(), this.resetCode.trim()).subscribe({
      next: (result) => {
        this.busy = false;
        this.resetToken = result.reset_token;
        this.resetStep = 3;
        this.success = 'Code verified. Choose a new password.';
      },
      error: (err: HttpErrorResponse) => {
        this.busy = false;
        this.error = CustomerAuthService.errorMessage(err, 'That code could not be verified.');
      },
    });
  }

  resetPassword(): void {
    this.error = '';
    if (this.resetForm.password.length < 6) {
      this.error = 'Password must be at least 6 characters.';
      return;
    }
    if (this.resetForm.password !== this.resetForm.confirm_password) {
      this.error = 'Passwords do not match.';
      return;
    }
    this.busy = true;
    this.auth.resetPassword(this.resetToken, this.resetForm.password, this.resetForm.confirm_password).subscribe({
      next: () => {
        this.busy = false;
        this.mode = 'login';
        this.error = '';
        this.success = 'Password updated. Sign in with your new password.';
      },
      error: (err: HttpErrorResponse) => {
        this.busy = false;
        this.error = CustomerAuthService.errorMessage(err, 'Could not reset the password.');
      },
    });
  }

  private safeReturnUrl(value: string | null): string {
    if (!value || !value.startsWith('/') || value.startsWith('//')) return '';
    return value;
  }
}

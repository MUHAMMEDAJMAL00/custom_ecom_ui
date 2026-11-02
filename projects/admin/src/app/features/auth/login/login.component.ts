import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, FormGroup, NonNullableFormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  readonly form: FormGroup<{
    email: FormControl<string>;
    password: FormControl<string>;
  }>;

  loading = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private fb: NonNullableFormBuilder,
    private auth: AuthService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  get emailInvalid(): boolean {
    const control = this.form.controls.email;
    return control.invalid && (control.dirty || control.touched);
  }

  get passwordInvalid(): boolean {
    const control = this.form.controls.password;
    return control.invalid && (control.dirty || control.touched);
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  submit(): void {
    this.errorMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading = false;
        void this.router.navigate(['/platform']);
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.errorMessage =
          error.error?.message || 'Could not sign in. Check the API server and try again.';
      },
    });
  }
}

import { CommonModule } from '@angular/common';
import { Component, NgModule, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { SharedModule } from '../../shared/shared.module';

interface CentrixSettings {
  api_url: string | null;
  client_id: string | null;
  client_secret: string | null;
  scope: string | null;
}

/** SMS & WhatsApp (Centrix) credentials for this shop, stored encrypted in tenant settings. */
@Component({
  selector: 'app-messaging-settings',
  standalone: false,
  template: `
    <div class="page-wrap">
      <div class="page-header">
        <div class="page-header-left">
          <div class="page-title-main">SMS &amp; WhatsApp</div>
          <div class="page-breadcrumb">
            <a [routerLink]="'/dashboard' | shopUrl">Dashboard</a>
            <span class="sep">›</span>
            <span class="current">SMS &amp; WhatsApp</span>
          </div>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-primary" *ngIf="canEdit" (click)="save()" [disabled]="saving || loading">
            {{ saving ? 'Saving…' : 'Save Settings' }}
          </button>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title">Centrix messaging account</div></div>
        <div class="card-body">
          <p class="form-hint">Order updates and OTPs are sent through these credentials. The secret is stored encrypted and never shown again.</p>
          <div *ngIf="loading" class="tbl-empty"><span class="pos-loader"><span></span><span></span><span></span></span></div>
          <div class="form-grid" *ngIf="!loading">
            <div class="form-group col-span-2">
              <label class="form-label">API URL</label>
              <input class="form-control" [(ngModel)]="form.api_url" placeholder="https://api.centrix.example/v1" [disabled]="!canEdit" />
            </div>
            <div class="form-group">
              <label class="form-label">Client ID</label>
              <input class="form-control" [(ngModel)]="form.client_id" [disabled]="!canEdit" />
            </div>
            <div class="form-group">
              <label class="form-label">Client Secret</label>
              <input class="form-control" type="password" [(ngModel)]="form.client_secret" placeholder="Leave blank to keep the saved secret" [disabled]="!canEdit" />
            </div>
            <div class="form-group col-span-2">
              <label class="form-label">Scope</label>
              <input class="form-control" [(ngModel)]="form.scope" [disabled]="!canEdit" />
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class MessagingSettingsComponent implements OnInit {
  form: CentrixSettings = { api_url: '', client_id: '', client_secret: '', scope: '' };
  loading = true;
  saving = false;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private notify: NotificationService,
  ) {}

  get canEdit(): boolean {
    return this.auth.hasPermission('config', 'update');
  }

  ngOnInit(): void {
    this.api.get<CentrixSettings>('/settings/messaging').subscribe({
      next: (res) => {
        const data = res.data || ({} as CentrixSettings);
        this.form = { api_url: data.api_url || '', client_id: data.client_id || '', client_secret: '', scope: data.scope || '' };
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  save(): void {
    // A blank secret keeps the stored one (settings.service.js)
    const body = { ...this.form, client_secret: this.form.client_secret || '' };
    this.saving = true;
    this.api.put<CentrixSettings>('/settings/messaging', body).subscribe({
      next: () => {
        this.saving = false;
        this.form.client_secret = '';
        this.notify.success('Messaging settings saved');
      },
      error: () => (this.saving = false),
    });
  }
}

const routes: Routes = [{ path: '', component: MessagingSettingsComponent }];

@NgModule({
  declarations: [MessagingSettingsComponent],
  imports: [CommonModule, FormsModule, RouterModule.forChild(routes), SharedModule],
})
export class MessagingModule {}

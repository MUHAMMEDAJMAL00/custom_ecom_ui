import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { AuditLogRoutingModule } from './audit-log-routing.module';
import { AuditLogListComponent } from './pages/audit-log-list/audit-log-list.component';

@NgModule({
  declarations: [AuditLogListComponent],
  imports: [CommonModule, FormsModule, RouterModule, SharedModule, AuditLogRoutingModule],
})
export class AuditLogModule {}

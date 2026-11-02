import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuditLogListComponent } from './pages/audit-log-list/audit-log-list.component';

const routes: Routes = [{ path: '', component: AuditLogListComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuditLogRoutingModule {}

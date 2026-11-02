import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { ReportsRoutingModule } from './reports-routing.module';
import { ReportListComponent } from './pages/report-list/report-list.component';

@NgModule({
  declarations: [ReportListComponent],
  imports: [CommonModule, FormsModule, RouterModule, SharedModule, ReportsRoutingModule],
})
export class ReportsModule {}

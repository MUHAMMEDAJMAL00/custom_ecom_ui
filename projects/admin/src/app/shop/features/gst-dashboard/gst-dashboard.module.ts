import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { GstDashboardRoutingModule } from './gst-dashboard-routing.module';
import { GstDashboardListComponent } from './pages/gst-dashboard-list/gst-dashboard-list.component';

@NgModule({
  declarations: [GstDashboardListComponent],
  imports: [CommonModule, FormsModule, RouterModule, SharedModule, GstDashboardRoutingModule],
})
export class GstDashboardModule {}

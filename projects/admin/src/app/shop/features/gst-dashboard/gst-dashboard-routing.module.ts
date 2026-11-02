import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GstDashboardListComponent } from './pages/gst-dashboard-list/gst-dashboard-list.component';

const routes: Routes = [{ path: '', component: GstDashboardListComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GstDashboardRoutingModule {}

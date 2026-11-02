import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BatchTrackingHomeComponent } from './pages/batch-tracking-home/batch-tracking-home.component';

const routes: Routes = [{ path: '', component: BatchTrackingHomeComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BatchTrackingRoutingModule {}

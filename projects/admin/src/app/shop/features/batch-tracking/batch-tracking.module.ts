import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { BatchTrackingRoutingModule } from './batch-tracking-routing.module';
import { BatchTrackingHomeComponent } from './pages/batch-tracking-home/batch-tracking-home.component';

@NgModule({
  declarations: [BatchTrackingHomeComponent],
  imports: [CommonModule, FormsModule, RouterModule, SharedModule, BatchTrackingRoutingModule],
})
export class BatchTrackingModule {}

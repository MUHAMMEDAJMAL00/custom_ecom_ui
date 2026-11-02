import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { PaymentSourcesRoutingModule } from './payment-sources-routing.module';
import { PaymentSourceListComponent } from './pages/payment-source-list/payment-source-list.component';

@NgModule({
  declarations: [PaymentSourceListComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, SharedModule, PaymentSourcesRoutingModule],
})
export class PaymentSourcesModule {}

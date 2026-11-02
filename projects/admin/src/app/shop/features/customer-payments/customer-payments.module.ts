import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { CustomerPaymentsRoutingModule } from './customer-payments-routing.module';
import { CustomerPaymentListComponent } from './pages/customer-payment-list/customer-payment-list.component';

@NgModule({
  declarations: [CustomerPaymentListComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, SharedModule, CustomerPaymentsRoutingModule],
})
export class CustomerPaymentsModule {}

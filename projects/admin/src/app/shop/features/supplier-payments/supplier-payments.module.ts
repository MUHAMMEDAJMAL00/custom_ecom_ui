import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { SupplierPaymentsRoutingModule } from './supplier-payments-routing.module';
import { SupplierPaymentListComponent } from './pages/supplier-payment-list/supplier-payment-list.component';

@NgModule({
  declarations: [SupplierPaymentListComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, SharedModule, SupplierPaymentsRoutingModule],
})
export class SupplierPaymentsModule {}

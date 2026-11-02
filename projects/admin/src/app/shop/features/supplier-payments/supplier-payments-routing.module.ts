import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SupplierPaymentListComponent } from './pages/supplier-payment-list/supplier-payment-list.component';

const routes: Routes = [{ path: '', component: SupplierPaymentListComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SupplierPaymentsRoutingModule {}

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomerPaymentListComponent } from './pages/customer-payment-list/customer-payment-list.component';

const routes: Routes = [{ path: '', component: CustomerPaymentListComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CustomerPaymentsRoutingModule {}

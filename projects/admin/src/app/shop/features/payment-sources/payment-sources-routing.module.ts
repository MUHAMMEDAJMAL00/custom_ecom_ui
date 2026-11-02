import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PaymentSourceListComponent } from './pages/payment-source-list/payment-source-list.component';

const routes: Routes = [{ path: '', component: PaymentSourceListComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PaymentSourcesRoutingModule {}

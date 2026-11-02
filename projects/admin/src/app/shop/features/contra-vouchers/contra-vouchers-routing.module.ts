import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ContraVoucherListComponent } from './pages/contra-voucher-list/contra-voucher-list.component';

const routes: Routes = [{ path: '', component: ContraVoucherListComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ContraVouchersRoutingModule {}

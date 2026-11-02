import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PurchaseReturnListComponent } from './pages/purchase-return-list/purchase-return-list.component';

const routes: Routes = [{ path: '', component: PurchaseReturnListComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PurchaseReturnsRoutingModule {}

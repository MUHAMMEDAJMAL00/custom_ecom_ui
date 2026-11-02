import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PurchaseListComponent } from './pages/purchase-list/purchase-list.component';

const routes: Routes = [{ path: '', component: PurchaseListComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PurchasesRoutingModule {}

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SellerListComponent } from './pages/seller-list/seller-list.component';
import { SellerPayoutsComponent } from './pages/seller-payouts/seller-payouts.component';
import { SellerSettlementComponent } from './pages/seller-settlement/seller-settlement.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', component: SellerListComponent },
  { path: 'payouts', component: SellerPayoutsComponent },
  { path: 'settlement', component: SellerSettlementComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SellersRoutingModule {}

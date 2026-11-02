import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { SellerListComponent } from './pages/seller-list/seller-list.component';
import { SellerPayoutsComponent } from './pages/seller-payouts/seller-payouts.component';
import { SellerSettlementComponent } from './pages/seller-settlement/seller-settlement.component';
import { SellersRoutingModule } from './sellers-routing.module';

@NgModule({
  declarations: [SellerListComponent, SellerPayoutsComponent, SellerSettlementComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, SharedModule, SellersRoutingModule],
})
export class SellersModule {}

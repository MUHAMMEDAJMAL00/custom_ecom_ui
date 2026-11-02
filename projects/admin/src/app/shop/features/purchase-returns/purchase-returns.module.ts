import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { PurchaseReturnsRoutingModule } from './purchase-returns-routing.module';
import { PurchaseReturnListComponent } from './pages/purchase-return-list/purchase-return-list.component';

@NgModule({
  declarations: [PurchaseReturnListComponent],
  imports: [CommonModule, FormsModule, RouterModule, SharedModule, PurchaseReturnsRoutingModule],
})
export class PurchaseReturnsModule {}

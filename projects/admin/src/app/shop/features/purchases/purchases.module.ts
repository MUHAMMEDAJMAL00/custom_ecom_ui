import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { PurchasesRoutingModule } from './purchases-routing.module';
import { PurchaseListComponent } from './pages/purchase-list/purchase-list.component';

@NgModule({
  declarations: [PurchaseListComponent],
  imports: [CommonModule, FormsModule, RouterModule, SharedModule, PurchasesRoutingModule],
})
export class PurchasesModule {}

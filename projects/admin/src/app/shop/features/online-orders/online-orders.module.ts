import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { OnlineOrdersRoutingModule } from './online-orders-routing.module';
import { OnlineOrderListComponent } from './pages/online-order-list/online-order-list.component';

@NgModule({
  declarations: [OnlineOrderListComponent],
  imports: [CommonModule, FormsModule, RouterModule, SharedModule, OnlineOrdersRoutingModule],
})
export class OnlineOrdersModule {}

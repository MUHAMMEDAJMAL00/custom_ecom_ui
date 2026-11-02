import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { ContraVouchersRoutingModule } from './contra-vouchers-routing.module';
import { ContraVoucherListComponent } from './pages/contra-voucher-list/contra-voucher-list.component';

@NgModule({
  declarations: [ContraVoucherListComponent],
  imports: [CommonModule, FormsModule, RouterModule, SharedModule, ContraVouchersRoutingModule],
})
export class ContraVouchersModule {}

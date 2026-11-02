import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { SalesRoutingModule } from './sales-routing.module';
import { SaleListComponent } from './pages/sale-list/sale-list.component';

@NgModule({
  declarations: [SaleListComponent],
  imports: [CommonModule, FormsModule, RouterModule, SharedModule, SalesRoutingModule],
})
export class SalesModule {}

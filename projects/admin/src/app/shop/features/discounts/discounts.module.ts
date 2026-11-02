import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { DiscountsRoutingModule } from './discounts-routing.module';
import { DiscountListComponent } from './pages/discount-list/discount-list.component';

@NgModule({
  declarations: [DiscountListComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, SharedModule, DiscountsRoutingModule],
})
export class DiscountsModule {}

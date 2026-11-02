import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { QuotationsRoutingModule } from './quotations-routing.module';
import { QuotationListComponent } from './pages/quotation-list/quotation-list.component';

@NgModule({
  declarations: [QuotationListComponent],
  imports: [CommonModule, FormsModule, RouterModule, SharedModule, QuotationsRoutingModule],
})
export class QuotationsModule {}

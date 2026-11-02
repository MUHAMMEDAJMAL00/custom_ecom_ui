import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { TaxesRoutingModule } from './taxes-routing.module';
import { TaxGroupListComponent } from './pages/tax-group-list/tax-group-list.component';

@NgModule({
  declarations: [TaxGroupListComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, SharedModule, TaxesRoutingModule],
})
export class TaxesModule {}

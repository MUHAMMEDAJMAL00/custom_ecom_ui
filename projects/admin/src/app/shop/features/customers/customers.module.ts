import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { CustomersRoutingModule } from './customers-routing.module';
import { CustomerListComponent } from './pages/customer-list/customer-list.component';

@NgModule({
  declarations: [CustomerListComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, SharedModule, CustomersRoutingModule],
})
export class CustomersModule {}

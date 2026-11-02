import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { PayrollRoutingModule } from './payroll-routing.module';
import { PayrollListComponent } from './pages/payroll-list/payroll-list.component';

@NgModule({
  declarations: [PayrollListComponent],
  imports: [CommonModule, FormsModule, RouterModule, SharedModule, PayrollRoutingModule],
})
export class PayrollModule {}

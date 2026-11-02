import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { SalaryRoutingModule } from './salary-routing.module';
import { SalaryListComponent } from './pages/salary-list/salary-list.component';

@NgModule({
  declarations: [SalaryListComponent],
  imports: [CommonModule, FormsModule, RouterModule, SharedModule, SalaryRoutingModule],
})
export class SalaryModule {}

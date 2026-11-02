import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { EmployeesRoutingModule } from './employees-routing.module';
import { EmployeeListComponent } from './pages/employee-list/employee-list.component';

@NgModule({
  declarations: [EmployeeListComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, SharedModule, EmployeesRoutingModule],
})
export class EmployeesModule {}

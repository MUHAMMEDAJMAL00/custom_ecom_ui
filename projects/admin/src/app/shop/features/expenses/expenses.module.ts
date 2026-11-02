import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { ExpensesRoutingModule } from './expenses-routing.module';
import { ExpenseListComponent } from './pages/expense-list/expense-list.component';

@NgModule({
  declarations: [ExpenseListComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, SharedModule, ExpensesRoutingModule],
})
export class ExpensesModule {}

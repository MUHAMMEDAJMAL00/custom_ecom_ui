import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { ChartOfAccountsRoutingModule } from './chart-of-accounts-routing.module';
import { ChartOfAccountsListComponent } from './pages/chart-of-accounts-list/chart-of-accounts-list.component';

@NgModule({
  declarations: [ChartOfAccountsListComponent],
  imports: [CommonModule, FormsModule, RouterModule, SharedModule, ChartOfAccountsRoutingModule],
})
export class ChartOfAccountsModule {}

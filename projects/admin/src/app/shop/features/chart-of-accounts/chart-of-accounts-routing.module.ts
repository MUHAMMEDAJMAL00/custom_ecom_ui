import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChartOfAccountsListComponent } from './pages/chart-of-accounts-list/chart-of-accounts-list.component';

const routes: Routes = [{ path: '', component: ChartOfAccountsListComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ChartOfAccountsRoutingModule {}

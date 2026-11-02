import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LedgerStatementListComponent } from './pages/ledger-statement-list/ledger-statement-list.component';

const routes: Routes = [{ path: '', component: LedgerStatementListComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LedgerStatementRoutingModule {}

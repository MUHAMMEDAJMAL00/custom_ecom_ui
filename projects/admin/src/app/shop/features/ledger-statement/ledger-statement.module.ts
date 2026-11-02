import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { LedgerStatementRoutingModule } from './ledger-statement-routing.module';
import { LedgerStatementListComponent } from './pages/ledger-statement-list/ledger-statement-list.component';

@NgModule({
  declarations: [LedgerStatementListComponent],
  imports: [CommonModule, FormsModule, RouterModule, SharedModule, LedgerStatementRoutingModule],
})
export class LedgerStatementModule {}

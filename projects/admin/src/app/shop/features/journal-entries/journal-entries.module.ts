import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { JournalEntriesRoutingModule } from './journal-entries-routing.module';
import { JournalEntryListComponent } from './pages/journal-entry-list/journal-entry-list.component';

@NgModule({
  declarations: [JournalEntryListComponent],
  imports: [CommonModule, FormsModule, RouterModule, SharedModule, JournalEntriesRoutingModule],
})
export class JournalEntriesModule {}

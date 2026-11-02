import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { JournalEntryListComponent } from './pages/journal-entry-list/journal-entry-list.component';

const routes: Routes = [{ path: '', component: JournalEntryListComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class JournalEntriesRoutingModule {}

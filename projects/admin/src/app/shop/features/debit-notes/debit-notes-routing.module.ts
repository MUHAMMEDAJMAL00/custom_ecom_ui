import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DebitNoteListComponent } from './pages/debit-note-list/debit-note-list.component';

const routes: Routes = [{ path: '', component: DebitNoteListComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DebitNotesRoutingModule {}

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreditNoteListComponent } from './pages/credit-note-list/credit-note-list.component';

const routes: Routes = [{ path: '', component: CreditNoteListComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CreditNotesRoutingModule {}

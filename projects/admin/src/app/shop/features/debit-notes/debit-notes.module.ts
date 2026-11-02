import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { DebitNotesRoutingModule } from './debit-notes-routing.module';
import { DebitNoteListComponent } from './pages/debit-note-list/debit-note-list.component';

@NgModule({
  declarations: [DebitNoteListComponent],
  imports: [CommonModule, FormsModule, RouterModule, SharedModule, DebitNotesRoutingModule],
})
export class DebitNotesModule {}

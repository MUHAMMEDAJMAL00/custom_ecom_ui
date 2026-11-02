import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { CreditNotesRoutingModule } from './credit-notes-routing.module';
import { CreditNoteListComponent } from './pages/credit-note-list/credit-note-list.component';

@NgModule({
  declarations: [CreditNoteListComponent],
  imports: [CommonModule, FormsModule, RouterModule, SharedModule, CreditNotesRoutingModule],
})
export class CreditNotesModule {}

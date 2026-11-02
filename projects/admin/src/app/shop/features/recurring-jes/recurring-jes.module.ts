import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { RecurringJesRoutingModule } from './recurring-jes-routing.module';
import { RecurringJeListComponent } from './pages/recurring-je-list/recurring-je-list.component';

@NgModule({
  declarations: [RecurringJeListComponent],
  imports: [CommonModule, FormsModule, RouterModule, SharedModule, RecurringJesRoutingModule],
})
export class RecurringJesModule {}

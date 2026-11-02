import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RecurringJeListComponent } from './pages/recurring-je-list/recurring-je-list.component';

const routes: Routes = [{ path: '', component: RecurringJeListComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RecurringJesRoutingModule {}

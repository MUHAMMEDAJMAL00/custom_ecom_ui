import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TaxGroupListComponent } from './pages/tax-group-list/tax-group-list.component';

const routes: Routes = [{ path: '', component: TaxGroupListComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TaxesRoutingModule {}

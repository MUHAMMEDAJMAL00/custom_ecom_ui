import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SaleListComponent } from './pages/sale-list/sale-list.component';

const routes: Routes = [{ path: '', component: SaleListComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SalesRoutingModule {}

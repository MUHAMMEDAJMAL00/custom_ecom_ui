import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { QuotationListComponent } from './pages/quotation-list/quotation-list.component';

const routes: Routes = [{ path: '', component: QuotationListComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class QuotationsRoutingModule {}

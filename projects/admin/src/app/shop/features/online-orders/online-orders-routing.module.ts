import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OnlineOrderListComponent } from './pages/online-order-list/online-order-list.component';

const routes: Routes = [{ path: '', component: OnlineOrderListComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OnlineOrdersRoutingModule {}

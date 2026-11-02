import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StoreListComponent } from './pages/store-list/store-list.component';

const routes: Routes = [{ path: '', component: StoreListComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StoresRoutingModule {}

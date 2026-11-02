import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReturnListComponent } from './pages/return-list/return-list.component';

const routes: Routes = [{ path: '', component: ReturnListComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReturnsRoutingModule {}

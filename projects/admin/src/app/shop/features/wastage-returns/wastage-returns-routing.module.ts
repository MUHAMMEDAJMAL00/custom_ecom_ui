import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WastageReturnListComponent } from './pages/wastage-return-list/wastage-return-list.component';

const routes: Routes = [{ path: '', component: WastageReturnListComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class WastageReturnsRoutingModule {}

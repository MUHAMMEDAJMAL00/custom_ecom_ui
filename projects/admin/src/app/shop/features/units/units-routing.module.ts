import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UnitListComponent } from './pages/unit-list/unit-list.component';

const routes: Routes = [{ path: '', component: UnitListComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UnitsRoutingModule {}

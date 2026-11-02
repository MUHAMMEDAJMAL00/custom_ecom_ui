import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SalaryListComponent } from './pages/salary-list/salary-list.component';

const routes: Routes = [{ path: '', component: SalaryListComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SalaryRoutingModule {}

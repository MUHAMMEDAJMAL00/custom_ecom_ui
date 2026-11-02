import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CashRegisterComponent } from './pages/cash-register/cash-register.component';

const routes: Routes = [{ path: '', component: CashRegisterComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CashRoutingModule {}

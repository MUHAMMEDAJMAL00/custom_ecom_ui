import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AssetsRegisterListComponent } from './pages/assets-register-list/assets-register-list.component';

const routes: Routes = [{ path: '', component: AssetsRegisterListComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AssetsRegisterRoutingModule {}

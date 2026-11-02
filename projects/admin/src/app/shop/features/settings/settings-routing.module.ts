import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SettingsListComponent } from './pages/settings-list/settings-list.component';

const routes: Routes = [{ path: '', component: SettingsListComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SettingsRoutingModule {}

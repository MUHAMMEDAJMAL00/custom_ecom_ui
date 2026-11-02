import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { RoleListComponent } from './pages/role-list/role-list.component';

const routes: Routes = [{ path: '', component: RoleListComponent }];

/** Roles & permissions (new screen in the MySkin admin layout). Permissions of disabled modules are hidden by the API. */
@NgModule({
  declarations: [RoleListComponent],
  imports: [CommonModule, FormsModule, RouterModule.forChild(routes), SharedModule],
})
export class RolesModule {}

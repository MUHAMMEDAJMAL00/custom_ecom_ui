import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { UsersRoutingModule } from './users-routing.module';
import { UserListComponent } from './pages/user-list/user-list.component';

@NgModule({
  declarations: [UserListComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, SharedModule, UsersRoutingModule],
})
export class UsersModule {}

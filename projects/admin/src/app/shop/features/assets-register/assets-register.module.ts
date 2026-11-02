import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { AssetsRegisterRoutingModule } from './assets-register-routing.module';
import { AssetsRegisterListComponent } from './pages/assets-register-list/assets-register-list.component';

@NgModule({
  declarations: [AssetsRegisterListComponent],
  imports: [CommonModule, FormsModule, RouterModule, SharedModule, AssetsRegisterRoutingModule],
})
export class AssetsRegisterModule {}

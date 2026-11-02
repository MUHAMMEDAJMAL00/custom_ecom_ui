import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { StoresRoutingModule } from './stores-routing.module';
import { StoreListComponent } from './pages/store-list/store-list.component';

@NgModule({
  declarations: [StoreListComponent],
  imports: [CommonModule, FormsModule, RouterModule, SharedModule, StoresRoutingModule],
})
export class StoresModule {}

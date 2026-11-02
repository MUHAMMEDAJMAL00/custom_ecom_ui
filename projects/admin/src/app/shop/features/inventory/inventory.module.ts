import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { InventoryRoutingModule } from './inventory-routing.module';
import { InventoryHomeComponent } from './pages/inventory-home/inventory-home.component';

@NgModule({
  declarations: [InventoryHomeComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, SharedModule, InventoryRoutingModule],
})
export class InventoryModule {}

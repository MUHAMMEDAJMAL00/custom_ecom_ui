import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { ProductsRoutingModule } from './products-routing.module';
import { ProductListComponent } from './pages/product-list/product-list.component';

@NgModule({
  declarations: [ProductListComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, SharedModule, ProductsRoutingModule],
})
export class ProductsModule {}

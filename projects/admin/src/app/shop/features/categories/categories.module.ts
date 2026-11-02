import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { CategoriesRoutingModule } from './categories-routing.module';
import { CategoryListComponent } from './pages/category-list/category-list.component';

@NgModule({
  declarations: [CategoryListComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, SharedModule, CategoriesRoutingModule],
})
export class CategoriesModule {}

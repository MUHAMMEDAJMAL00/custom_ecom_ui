import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { BrandListComponent } from './pages/brand-list/brand-list.component';

const routes: Routes = [{ path: '', component: BrandListComponent }];

@NgModule({
  declarations: [BrandListComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SharedModule, RouterModule.forChild(routes)],
})
export class BrandsModule {}

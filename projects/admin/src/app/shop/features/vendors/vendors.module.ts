import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { VendorsRoutingModule } from './vendors-routing.module';
import { VendorListComponent } from './pages/vendor-list/vendor-list.component';

@NgModule({
  declarations: [VendorListComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, SharedModule, VendorsRoutingModule],
})
export class VendorsModule {}

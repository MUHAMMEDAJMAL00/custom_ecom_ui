import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { WastageReturnsRoutingModule } from './wastage-returns-routing.module';
import { WastageReturnListComponent } from './pages/wastage-return-list/wastage-return-list.component';

@NgModule({
  declarations: [WastageReturnListComponent],
  imports: [CommonModule, FormsModule, RouterModule, SharedModule, WastageReturnsRoutingModule],
})
export class WastageReturnsModule {}

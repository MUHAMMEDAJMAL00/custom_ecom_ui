import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { ReturnsRoutingModule } from './returns-routing.module';
import { ReturnListComponent } from './pages/return-list/return-list.component';

@NgModule({
  declarations: [ReturnListComponent],
  imports: [CommonModule, FormsModule, RouterModule, SharedModule, ReturnsRoutingModule],
})
export class ReturnsModule {}

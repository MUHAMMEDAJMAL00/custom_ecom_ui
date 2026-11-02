import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { UnitsRoutingModule } from './units-routing.module';
import { UnitListComponent } from './pages/unit-list/unit-list.component';

@NgModule({
  declarations: [UnitListComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, SharedModule, UnitsRoutingModule],
})
export class UnitsModule {}

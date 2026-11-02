import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { CashRoutingModule } from './cash-routing.module';
import { CashRegisterComponent } from './pages/cash-register/cash-register.component';

@NgModule({
  declarations: [CashRegisterComponent],
  imports: [CommonModule, FormsModule, RouterModule, SharedModule, CashRoutingModule],
})
export class CashModule {}

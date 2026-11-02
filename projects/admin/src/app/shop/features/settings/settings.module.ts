import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { SettingsRoutingModule } from './settings-routing.module';
import { SettingsListComponent } from './pages/settings-list/settings-list.component';

@NgModule({
  declarations: [SettingsListComponent],
  imports: [CommonModule, FormsModule, RouterModule, SharedModule, SettingsRoutingModule],
})
export class SettingsModule {}

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { NotificationsRoutingModule } from './notifications-routing.module';
import { NotificationListComponent } from './pages/notification-list/notification-list.component';

@NgModule({
  declarations: [NotificationListComponent],
  imports: [CommonModule, RouterModule, SharedModule, NotificationsRoutingModule],
})
export class NotificationsModule {}

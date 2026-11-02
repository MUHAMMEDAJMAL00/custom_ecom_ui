import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { DrawerComponent } from './components/drawer/drawer.component';
import { PaginationComponent } from './components/pagination/pagination.component';
import { PlaceholderComponent } from './components/placeholder/placeholder.component';
import { RowActionsComponent } from './components/row-actions/row-actions.component';
import { ToastComponent } from './components/toast/toast.component';
import { StatusBadgePipe } from './pipes/status-badge.pipe';
import { ModalComponent } from './components/modal/modal.component';
import { ShopUrlPipe } from './pipes/shop-url.pipe';

// MySkin admin SharedModule, plus the shopUrl pipe for /t/:slug links.
@NgModule({
  declarations: [
    PlaceholderComponent,
    ToastComponent,
    ConfirmDialogComponent,
    DrawerComponent,
    PaginationComponent,
    RowActionsComponent,
    StatusBadgePipe,
    ModalComponent,
    ShopUrlPipe,
  ],
  imports: [CommonModule, RouterModule],
  exports: [
    PlaceholderComponent,
    ToastComponent,
    ConfirmDialogComponent,
    DrawerComponent,
    PaginationComponent,
    RowActionsComponent,
    StatusBadgePipe,
    ModalComponent,
    ShopUrlPipe,
  ],
})
export class SharedModule {}

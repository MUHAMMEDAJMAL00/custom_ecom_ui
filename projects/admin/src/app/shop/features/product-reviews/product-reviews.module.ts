import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { ReviewListComponent } from './pages/review-list/review-list.component';

const routes: Routes = [{ path: '', component: ReviewListComponent }];

@NgModule({
  declarations: [ReviewListComponent],
  imports: [CommonModule, FormsModule, SharedModule, RouterModule.forChild(routes)],
})
export class ProductReviewsModule {}

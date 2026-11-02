import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { BannerListComponent } from './pages/banner-list/banner-list.component';
import { OfferStripListComponent } from './pages/offer-strip-list/offer-strip-list.component';
import { HomeSectionListComponent } from './pages/home-section-list/home-section-list.component';
import { ThemeEditorComponent } from './pages/theme-editor/theme-editor.component';

const routes: Routes = [
  { path: '', redirectTo: 'banners', pathMatch: 'full' },
  { path: 'banners', component: BannerListComponent },
  { path: 'offers', component: OfferStripListComponent },
  { path: 'sections', component: HomeSectionListComponent },
  { path: 'theme', component: ThemeEditorComponent },
];

@NgModule({
  declarations: [BannerListComponent, OfferStripListComponent, HomeSectionListComponent, ThemeEditorComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SharedModule, RouterModule.forChild(routes)],
})
export class WebsiteModule {}

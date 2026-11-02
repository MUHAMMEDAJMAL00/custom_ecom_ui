import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ShopContextService } from '../../core/services/shop-context.service';
import { StorefrontApiService } from '../../core/services/storefront-api.service';

/** /pages/:slug — About, contact, shipping, returns, terms, privacy and refund pages. */
@Component({
  selector: 'app-cms-page',
  standalone: false,
  templateUrl: './cms-page.component.html',
  styleUrls: ['./cms-page.component.scss'],
})
export class CmsPageComponent implements OnInit {
  title = '';
  content = '';
  loading = true;
  notFound = false;

  constructor(
    private route: ActivatedRoute,
    private api: StorefrontApiService,
    private shop: ShopContextService,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug') || '';
      this.loading = true;
      this.notFound = false;
      this.api.page(this.shop.slug, slug).subscribe({
        next: (page) => {
          this.title = page.title || slug;
          this.content = page.content || page.body || '';
          this.loading = false;
          document.title = this.title;
        },
        error: (_err: HttpErrorResponse) => {
          this.loading = false;
          this.notFound = true;
        },
      });
    });
  }
}

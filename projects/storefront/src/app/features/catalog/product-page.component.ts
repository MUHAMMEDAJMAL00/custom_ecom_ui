import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, combineLatest, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { ReviewPage, StoreCategory, StoreProduct, StoreReview, StoreVariant } from '../../core/models/storefront.model';
import { CartService } from '../../core/services/cart.service';
import { CustomerAuthService } from '../../core/services/customer-auth.service';
import { ShopContextService } from '../../core/services/shop-context.service';
import { ShopNavService } from '../../core/services/shop-nav.service';
import { StorefrontApiService } from '../../core/services/storefront-api.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { flattenCategories } from '../../core/utils/category-match';
import { resolveImageUrl } from '../../core/utils/image.util';
import { HttpErrorResponse } from '@angular/common/http';

/** Product detail: /catalog/product/:ref (ref = the product's public id). */
@Component({
  selector: 'app-product-page',
  standalone: false,
  templateUrl: './product-page.component.html',
  styleUrls: ['./product-page.component.scss'],
})
export class ProductPageComponent implements OnInit, OnDestroy {
  product: StoreProduct | null = null;
  category: StoreCategory | null = null;
  related: StoreProduct[] = [];
  variant: StoreVariant | null = null;
  quantity = 1;
  loading = true;
  notFound = false;
  currency = 'INR';
  showStock = false;
  wishlistEnabled = false;
  wishlisted = false;

  reviewsEnabled = false;
  reviews: ReviewPage | null = null;
  reviewsLoading = false;
  reviewPage = 1;
  reviewRating = '';
  reviewsError = '';
  canReview = false;
  myReview: StoreReview | null = null;
  showReviewForm = false;
  reviewForm = { rating: 5, title: '', body: '' };
  reviewSaving = false;
  reviewError = '';
  reviewSuccess = '';
  private productRef = '';

  private sub?: Subscription;
  private wishSub?: Subscription;
  private authSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: StorefrontApiService,
    private shop: ShopContextService,
    private cart: CartService,
    private wishlist: WishlistService,
    readonly auth: CustomerAuthService,
    readonly nav: ShopNavService,
  ) {}

  ngOnInit(): void {
    this.wishSub = this.wishlist.items$.subscribe(() => this.updateWishlisted());
    this.authSub = this.auth.user$.subscribe(() => {
      this.loadMyReview();
      if (this.productRef) this.loadReviews(this.reviewPage);
    });
    this.sub = combineLatest([this.route.paramMap, this.shop.load()])
      .pipe(
        switchMap(([params, ctx]) => {
          this.loading = true;
          this.notFound = false;
          this.currency = ctx.bootstrap.tenant.currency || 'INR';
          this.showStock = !!ctx.bootstrap.features['inventory'];
          this.wishlistEnabled = ctx.bootstrap.features['wishlist'] === true;
          this.reviewsEnabled = ctx.bootstrap.features['reviews'] === true;
          const ref = params.get('ref') || '';
          this.productRef = ref;
          return combineLatest([
            this.api.product(this.shop.slug, ref).pipe(catchError(() => of(null))),
            of(flattenCategories(ctx.categories)),
          ]);
        }),
      )
      .subscribe(([product, categories]) => {
        this.loading = false;
        if (!product) {
          this.notFound = true;
          return;
        }
        this.product = product;
        this.variant = product.variants?.[0] ?? null;
        this.quantity = 1;
        this.reviews = null;
        this.myReview = null;
        this.reviewRating = '';
        this.showReviewForm = false;
        this.reviewSuccess = '';
        this.updateWishlisted();
        this.category = categories.find((c) => c.id === product.category_id) || null;
        document.title = product.name;
        this.loadReviews(1);
        this.loadMyReview();
        this.loadRelated();
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.wishSub?.unsubscribe();
    this.authSub?.unsubscribe();
  }

  private loadRelated(): void {
    this.related = [];
    if (!this.category || !this.product) return;
    const id = this.product.id;
    this.api
      .productPage(this.shop.slug, { category: this.category.slug, limit: 9 })
      .pipe(catchError(() => of(null)))
      .subscribe((page) => (this.related = (page?.data ?? []).filter((p) => p.id !== id).slice(0, 8)));
  }

  get image(): string {
    return resolveImageUrl(this.variant?.image_url || this.product?.image_url);
  }

  get price(): number {
    return Number(this.variant?.selling_price ?? this.product?.selling_price) || 0;
  }

  get mrp(): number {
    return Number(this.variant?.mrp ?? this.product?.mrp) || 0;
  }

  get discount(): number {
    return this.mrp > this.price ? Math.round(((this.mrp - this.price) / this.mrp) * 100) : 0;
  }

  /** Stock of the chosen variant (or the product), summed across branches. */
  get stock(): number | null {
    const rows = this.product?.ProductInventories;
    if (!rows?.length) return null;
    const key = this.variant?.id ?? null;
    return rows.filter((r) => (r.variant_id ?? null) === key).reduce((sum, r) => sum + Number(r.quantity || 0), 0);
  }

  changeQty(delta: number): void {
    this.quantity = Math.max(1, this.quantity + delta);
  }

  addToCart(): void {
    if (!this.product) return;
    this.cart.add(this.product, this.variant, this.quantity);
    this.nav.notify(`${this.product.name} added to your cart.`);
  }

  toggleWishlist(): void {
    if (!this.product) return;
    this.wishlist.toggle(this.product);
    this.nav.notify(this.wishlisted ? 'Removed from your wishlist.' : 'Saved to your wishlist.');
  }

  loadReviews(page = 1): void {
    if (!this.reviewsEnabled || !this.productRef) return;
    this.reviewsLoading = true;
    this.reviewsError = '';
    this.reviewPage = page;
    const path = `/storefront/products/${encodeURIComponent(this.productRef)}/reviews?page=${page}&limit=6${
      this.reviewRating ? `&rating=${encodeURIComponent(this.reviewRating)}` : ''
    }`;
    const request = this.auth.isLoggedIn
      ? this.auth.requestRaw<ReviewPage>('GET', path)
      : this.api.reviews(this.shop.slug, this.productRef, page, this.reviewRating);
    request.subscribe({
      next: (reviews) => {
        this.reviews = reviews;
        this.reviewsLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.reviewsLoading = false;
        this.reviewsError = CustomerAuthService.errorMessage(err, 'Could not load reviews.');
      },
    });
  }

  filterReviews(rating: string): void {
    this.reviewRating = rating;
    this.loadReviews(1);
  }

  startReview(): void {
    if (!this.auth.isLoggedIn) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    if (this.myReview) {
      this.reviewForm = {
        rating: this.myReview.rating,
        title: this.myReview.title || '',
        body: this.myReview.body || '',
      };
    }
    this.reviewError = '';
    this.reviewSuccess = '';
    this.showReviewForm = true;
  }

  submitReview(): void {
    if (!this.productRef) return;
    this.reviewSaving = true;
    this.reviewError = '';
    this.auth
      .request<{ id: number; status: string }>('POST', `/storefront/products/${encodeURIComponent(this.productRef)}/reviews`, {
        rating: this.reviewForm.rating,
        title: this.reviewForm.title.trim() || null,
        body: this.reviewForm.body.trim() || null,
        images: [],
      })
      .subscribe({
        next: () => {
          this.reviewSaving = false;
          this.showReviewForm = false;
          this.reviewSuccess = 'Thanks! Your review was saved.';
          this.loadReviews(1);
          this.loadMyReview();
        },
        error: (err: HttpErrorResponse) => {
          this.reviewSaving = false;
          this.reviewError = CustomerAuthService.errorMessage(err, 'Could not save your review.');
        },
      });
  }

  markHelpful(review: StoreReview): void {
    if (!this.auth.isLoggedIn) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    this.auth.request<unknown>('POST', `/storefront/reviews/${review.id}/helpful`).subscribe({
      next: () => {
        review.voted_helpful = !review.voted_helpful;
        review.helpful_count += review.voted_helpful ? 1 : -1;
      },
      error: () => undefined,
    });
  }

  stars(rating: number): number[] {
    return Array.from({ length: 5 }, (_, index) => index + 1);
  }

  barWidth(rating: number): number {
    const summary = this.reviews?.summary;
    if (!summary || !summary.ratings) return 0;
    return ((summary.distribution[rating] || 0) / summary.ratings) * 100;
  }

  private loadMyReview(): void {
    if (!this.reviewsEnabled || !this.productRef || !this.auth.isLoggedIn) {
      this.canReview = false;
      this.myReview = null;
      return;
    }
    this.auth
      .request<{ can_review: boolean; verified_buyer: boolean; review: StoreReview | null }>(
        'GET',
        `/storefront/products/${encodeURIComponent(this.productRef)}/reviews/mine`,
      )
      .subscribe({
        next: (result) => {
          this.canReview = result.can_review;
          this.myReview = result.review;
        },
        error: () => {
          this.canReview = false;
          this.myReview = null;
        },
      });
  }

  private updateWishlisted(): void {
    this.wishlisted = !!this.product && this.wishlist.has(this.product.id);
  }
}

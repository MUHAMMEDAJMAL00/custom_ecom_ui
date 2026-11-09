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

/** Same per-line cap the cart service and API enforce. */
const CART_LINE_MAX = 100;

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
  imageIndex = 0;
  adding = false;
  loading = true;
  notFound = false;
  currency = 'INR';
  showStock = false;
  wishlistEnabled = false;
  wishlisted = false;
  shopName = '';
  shopEmail = '';
  showFullDescription = false;

  /** Shop promises under the buy buttons (same boxes as MySkin's product page). */
  readonly perks = [
    { icon: 'bi-truck', title: 'Fast Delivery', note: 'To your doorstep' },
    { icon: 'bi-arrow-repeat', title: 'Easy Returns', note: 'Hassle-free' },
    { icon: 'bi-shield-check', title: 'Secure Payment', note: '100% protected' },
    { icon: 'bi-patch-check', title: 'Genuine Products', note: 'Quality assured' },
  ];

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
          this.shopName = ctx.bootstrap.tenant.name;
          this.shopEmail = ctx.bootstrap.tenant.email || '';
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
        this.imageIndex = 0;
        this.showFullDescription = false;
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

  /** Variant photo (if any), the main photo, then the gallery — without duplicates. */
  get images(): string[] {
    const raw = [this.variant?.image_url, this.product?.image_url, ...(this.product?.gallery_urls ?? [])];
    const urls = raw.filter((u): u is string => !!u).map((u) => resolveImageUrl(u));
    return urls.length ? [...new Set(urls)] : [resolveImageUrl(null)];
  }

  get image(): string {
    const list = this.images;
    return list[Math.min(this.imageIndex, list.length - 1)];
  }

  showImage(index: number): void {
    const count = this.images.length;
    this.imageIndex = (index + count) % count;
  }

  /** Desktop hover on a thumbnail previews that photo. */
  previewImage(index: number): void {
    if (typeof matchMedia !== 'undefined' && matchMedia('(hover: hover)').matches) this.showImage(index);
  }

  // Swipe between photos on touch screens
  private swipeStartX: number | null = null;

  onSwipeStart(event: TouchEvent): void {
    this.swipeStartX = event.touches[0]?.clientX ?? null;
  }

  onSwipeEnd(event: TouchEvent): void {
    if (this.swipeStartX === null) return;
    const dx = (event.changedTouches[0]?.clientX ?? this.swipeStartX) - this.swipeStartX;
    this.swipeStartX = null;
    if (Math.abs(dx) > 40 && this.images.length > 1) this.showImage(this.imageIndex + (dx < 0 ? 1 : -1));
  }

  scrollToReviews(): void {
    document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  selectVariant(v: StoreVariant): void {
    this.variant = v;
    this.imageIndex = 0;
    this.quantity = Math.max(1, Math.min(this.quantity, this.maxQty));
  }

  /** Units of the chosen product/variant already in the cart. */
  get inCart(): number {
    if (!this.product) return 0;
    const id = this.product.id;
    const vid = this.variant?.id ?? null;
    return this.cart.lines
      .filter((l) => l.product_id === id && (l.variant_id ?? null) === vid)
      .reduce((sum, l) => sum + Number(l.quantity || 0), 0);
  }

  /** How many more units can be added: limited by stock, the product's max per order and the cart cap. */
  get maxQty(): number {
    const limits = [CART_LINE_MAX];
    if (this.product?.max_quantity) limits.push(this.product.max_quantity);
    if (this.showStock && this.stock !== null) limits.push(Math.floor(this.stock));
    return Math.max(0, Math.min(...limits) - this.inCart);
  }

  /** Description split into key points (lines, sentences or "; " parts) for a checklist view. */
  get descPoints(): string[] {
    const text = this.product?.description?.trim() || '';
    return text
      .split(/\r?\n|;\s+|(?<=\.)\s+/)
      .map((s) => s.trim().replace(/\.$/, ''))
      .filter(Boolean)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1));
  }

  get total(): number {
    return this.price * this.quantity;
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

  /** Sold out only when stock is tracked and nothing is left (not counting what is already in the cart). */
  get isOutOfStock(): boolean {
    return this.showStock && this.stock !== null && this.stock <= 0;
  }

  get stockStatus(): { label: string; class: string } {
    if (!this.showStock || this.stock === null) return { label: 'In Stock', class: 'text-success' };
    if (this.stock <= 0) return { label: 'Out of Stock', class: 'text-danger' };
    if (this.stock <= 5) return { label: `Only ${this.stock} left`, class: 'text-warning' };
    return { label: 'In Stock', class: 'text-success' };
  }

  changeQty(delta: number): void {
    this.setQty(this.quantity + delta);
  }

  setQty(value: number | string): void {
    const n = Math.round(Number(value)) || 1;
    this.quantity = Math.max(1, Math.min(n, Math.max(1, this.maxQty)));
  }

  addToCart(): void {
    if (!this.product || this.adding) return;
    if (this.maxQty <= 0) {
      this.nav.notify(this.inCart ? `You already have the maximum of this item in your cart.` : 'This item is out of stock.');
      return;
    }
    const qty = Math.min(this.quantity, this.maxQty);
    const name = this.product.name;
    this.adding = true;
    this.cart.add(this.product, this.variant, qty, (ok) => {
      this.adding = false;
      if (!ok) {
        this.nav.notify('Could not add to your cart. Please try again.');
        return;
      }
      this.quantity = 1;
      this.nav.notify(`${qty} × ${name} added to your cart.`);
    });
  }

  /** Adds the chosen quantity (unless the cart already holds it) and goes straight to checkout. */
  buyNow(): void {
    if (!this.product || this.adding) return;
    if (this.inCart || this.maxQty <= 0) {
      void this.router.navigate(['/checkout']);
      return;
    }
    this.adding = true;
    this.cart.add(this.product, this.variant, Math.min(this.quantity, this.maxQty), (ok) => {
      this.adding = false;
      if (!ok) {
        this.nav.notify('Could not add to your cart. Please try again.');
        return;
      }
      void this.router.navigate(['/checkout']);
    });
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

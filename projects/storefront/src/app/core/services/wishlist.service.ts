import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { StoreProduct } from '../models/storefront.model';
import { WishlistLine } from '../models/customer.model';
import { CustomerAuthService } from './customer-auth.service';
import { ShopContextService } from './shop-context.service';

interface ServerWishlistRow {
  id: number;
  product_id: number;
  Product?: {
    id: number;
    public_id: string;
    name: string;
    selling_price: string | number;
    mrp: string | number | null;
    image_url: string | null;
  } | null;
}

/** Guest wishlist in localStorage, merged into the account wishlist after sign-in. */
@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly itemsSubject = new BehaviorSubject<WishlistLine[]>([]);

  readonly items$ = this.itemsSubject.asObservable();
  readonly count$ = this.items$.pipe(map((items) => items.length));

  constructor(
    private auth: CustomerAuthService,
    private shop: ShopContextService,
  ) {
    this.auth.user$.pipe(distinctUntilChanged((a, b) => (a?.id ?? 0) === (b?.id ?? 0))).subscribe((user) => {
      if (user) this.syncSignedIn();
      else this.itemsSubject.next(this.readGuest());
    });
  }

  has(productId: number): boolean {
    return this.itemsSubject.value.some((item) => item.product_id === productId);
  }

  toggle(product: Pick<StoreProduct, 'id' | 'public_id' | 'name' | 'selling_price' | 'mrp' | 'image_url'>): void {
    const existing = this.itemsSubject.value.find((item) => item.product_id === product.id);
    if (existing) {
      this.remove(existing);
      return;
    }

    if (!this.auth.isLoggedIn) {
      const items = this.readGuest();
      if (!items.some((item) => item.product_id === product.id)) {
        items.unshift(this.fromProduct(product));
        this.writeGuest(items);
        this.itemsSubject.next(items);
      }
      return;
    }

    this.auth.request<unknown>('POST', '/storefront/wishlist', { product_id: product.id }).subscribe({
      next: () => this.loadServer(),
      error: () => undefined,
    });
  }

  remove(item: WishlistLine): void {
    if (!this.auth.isLoggedIn || !item.row_id) {
      const items = this.readGuest().filter((row) => row.product_id !== item.product_id);
      this.writeGuest(items);
      this.itemsSubject.next(items);
      return;
    }
    this.auth.request<unknown>('DELETE', `/storefront/wishlist/product/${item.product_id}`).subscribe({
      next: () => this.loadServer(),
      error: () => undefined,
    });
  }

  private syncSignedIn(): void {
    this.mergeGuest()
      .pipe(switchMap(() => this.fetchServer()))
      .subscribe({
        next: (items) => this.itemsSubject.next(items),
        error: () => this.itemsSubject.next([]),
      });
  }

  private loadServer(): void {
    this.fetchServer().subscribe({
      next: (items) => this.itemsSubject.next(items),
      error: () => undefined,
    });
  }

  private fetchServer(): Observable<WishlistLine[]> {
    return this.auth
      .request<ServerWishlistRow[]>('GET', '/storefront/wishlist')
      .pipe(map((rows) => rows.map((row) => this.fromServer(row))));
  }

  private mergeGuest(): Observable<void> {
    const guest = this.readGuest();
    if (!guest.length) return of(undefined);

    return this.fetchServer().pipe(
      switchMap((server) => {
        const ids = [...new Set([...server.map((row) => row.product_id), ...guest.map((row) => row.product_id)])];
        return this.auth.request<unknown>('PUT', '/storefront/wishlist', { product_ids: ids });
      }),
      map(() => {
        this.writeGuest([]);
        return undefined;
      }),
      catchError(() => of(undefined)),
    );
  }

  private fromServer(row: ServerWishlistRow): WishlistLine {
    const product = row.Product;
    return {
      row_id: row.id,
      product_id: row.product_id,
      public_id: product?.public_id || '',
      name: product?.name || 'Product',
      price: Number(product?.selling_price) || 0,
      mrp: Number(product?.mrp) || 0,
      image_url: product?.image_url || null,
    };
  }

  private fromProduct(
    product: Pick<StoreProduct, 'id' | 'public_id' | 'name' | 'selling_price' | 'mrp' | 'image_url'>,
  ): WishlistLine {
    return {
      row_id: null,
      product_id: product.id,
      public_id: product.public_id,
      name: product.name,
      price: Number(product.selling_price) || 0,
      mrp: Number(product.mrp) || 0,
      image_url: product.image_url,
    };
  }

  private guestKey(): string {
    return `wishlist:${this.shop.slug || 'default'}`;
  }

  private readGuest(): WishlistLine[] {
    try {
      const raw = localStorage.getItem(this.guestKey());
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeGuest(items: WishlistLine[]): void {
    try {
      if (items.length) localStorage.setItem(this.guestKey(), JSON.stringify(items));
      else localStorage.removeItem(this.guestKey());
    } catch {
      // storage blocked: the in-memory wishlist still works this session
    }
  }
}

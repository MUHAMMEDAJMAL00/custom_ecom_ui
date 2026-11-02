import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { StoreProduct, StoreVariant } from '../models/storefront.model';
import { CartLine } from '../models/customer.model';
import { CustomerAuthService } from './customer-auth.service';
import { ShopContextService } from './shop-context.service';

interface ServerCartRow {
  id: number;
  product_id: number;
  variant_id: number | null;
  quantity: string | number;
  Product?: {
    id: number;
    public_id: string;
    name: string;
    selling_price: string | number;
    mrp: string | number | null;
    image_url: string | null;
  } | null;
  ProductVariant?: {
    id: number;
    variant_name: string;
    selling_price: string | number;
    mrp: string | number | null;
    image_url: string | null;
  } | null;
}

/** Guest cart in localStorage, merged into the customer's server cart after sign-in. */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly linesSubject = new BehaviorSubject<CartLine[]>([]);
  private readonly loadedSubject = new BehaviorSubject<boolean>(false);

  readonly lines$ = this.linesSubject.asObservable();
  readonly loaded$ = this.loadedSubject.asObservable();
  readonly count$ = this.lines$.pipe(map((lines) => lines.reduce((sum, line) => sum + line.quantity, 0)));

  constructor(
    private auth: CustomerAuthService,
    private shop: ShopContextService,
  ) {
    this.auth.user$.pipe(distinctUntilChanged((a, b) => (a?.id ?? 0) === (b?.id ?? 0))).subscribe((user) => {
      if (user) this.syncSignedIn();
      else {
        this.linesSubject.next(this.readGuest());
        this.loadedSubject.next(true);
      }
    });
  }

  get lines(): CartLine[] {
    return this.linesSubject.value;
  }

  get count(): number {
    return this.lines.reduce((sum, line) => sum + line.quantity, 0);
  }

  /** Adds a product (optionally a variant) to the guest or server cart. */
  add(
    product: Pick<StoreProduct, 'id' | 'public_id' | 'name' | 'selling_price' | 'mrp' | 'image_url'>,
    variant: StoreVariant | null,
    quantity = 1,
  ): void {
    const qty = Math.max(1, Math.min(100, Math.round(quantity)));

    if (!this.auth.isLoggedIn) {
      const lines = this.readGuest();
      const key = this.keyOf(product.id, variant?.id ?? null);
      const existing = lines.find((line) => this.keyOf(line.product_id, line.variant_id) === key);
      if (existing) {
        existing.quantity = Math.min(100, existing.quantity + qty);
      } else {
        lines.unshift({
          row_id: null,
          product_id: product.id,
          public_id: product.public_id,
          variant_id: variant?.id ?? null,
          variant_name: variant?.variant_name ?? null,
          name: product.name,
          price: Number(variant?.selling_price ?? product.selling_price) || 0,
          mrp: Number(variant?.mrp ?? product.mrp) || 0,
          image_url: variant?.image_url || product.image_url,
          quantity: qty,
        });
      }
      this.writeGuest(lines);
      this.linesSubject.next(lines);
      return;
    }

    this.auth
      .request<unknown>('POST', '/storefront/cart', {
        product_id: product.id,
        variant_id: variant?.id ?? null,
        quantity: qty,
      })
      .subscribe({
        next: () => this.loadServer(),
        error: () => undefined,
      });
  }

  updateQuantity(line: CartLine, quantity: number): void {
    const qty = Math.max(1, Math.min(100, Math.round(quantity)));
    if (!this.auth.isLoggedIn || !line.row_id) {
      const lines = this.readGuest().map((row) =>
        this.keyOf(row.product_id, row.variant_id) === this.keyOf(line.product_id, line.variant_id)
          ? { ...row, quantity: qty }
          : row,
      );
      this.writeGuest(lines);
      this.linesSubject.next(lines);
      return;
    }
    this.auth.request<unknown>('PUT', `/storefront/cart/${line.row_id}`, { quantity: qty }).subscribe({
      next: () => this.loadServer(),
      error: () => undefined,
    });
  }

  remove(line: CartLine): void {
    if (!this.auth.isLoggedIn || !line.row_id) {
      const lines = this.readGuest().filter(
        (row) => this.keyOf(row.product_id, row.variant_id) !== this.keyOf(line.product_id, line.variant_id),
      );
      this.writeGuest(lines);
      this.linesSubject.next(lines);
      return;
    }
    this.auth.request<unknown>('DELETE', `/storefront/cart/${line.row_id}`).subscribe({
      next: () => this.loadServer(),
      error: () => undefined,
    });
  }

  clear(): void {
    if (!this.auth.isLoggedIn) {
      this.writeGuest([]);
      this.linesSubject.next([]);
      return;
    }
    this.auth.request<unknown>('DELETE', '/storefront/cart').subscribe({
      next: () => this.linesSubject.next([]),
      error: () => undefined,
    });
  }

  /** Items the checkout expects: ids and quantities only, prices are set by the server. */
  checkoutItems(): { product_id: number; variant_id: number | null; quantity: number }[] {
    return this.lines.map((line) => ({
      product_id: line.product_id,
      variant_id: line.variant_id,
      quantity: line.quantity,
    }));
  }

  private syncSignedIn(): void {
    this.mergeGuest()
      .pipe(switchMap(() => this.fetchServer()))
      .subscribe({
        next: (lines) => {
          this.linesSubject.next(lines);
          this.loadedSubject.next(true);
        },
        error: () => {
          this.linesSubject.next([]);
          this.loadedSubject.next(true);
        },
      });
  }

  private loadServer(): void {
    this.fetchServer().subscribe({
      next: (lines) => {
        this.linesSubject.next(lines);
        this.loadedSubject.next(true);
      },
      error: () => undefined,
    });
  }

  private fetchServer(): Observable<CartLine[]> {
    return this.auth
      .request<ServerCartRow[]>('GET', '/storefront/cart')
      .pipe(map((rows) => rows.map((row) => this.fromServer(row))));
  }

  /** Combines the guest cart into the server cart, then removes the guest copy. */
  private mergeGuest(): Observable<void> {
    const guest = this.readGuest();
    if (!guest.length) return of(undefined);

    return this.fetchServer().pipe(
      switchMap((server) => {
        const merged = [...server];
        for (const line of guest) {
          const existing = merged.find(
            (row) => this.keyOf(row.product_id, row.variant_id) === this.keyOf(line.product_id, line.variant_id),
          );
          if (existing) existing.quantity = Math.min(100, existing.quantity + line.quantity);
          else merged.push({ ...line, row_id: null });
        }
        return this.auth.request<unknown>('PUT', '/storefront/cart', {
          items: merged.map((line) => ({
            product_id: line.product_id,
            variant_id: line.variant_id,
            quantity: line.quantity,
          })),
        });
      }),
      map(() => {
        this.writeGuest([]);
        return undefined;
      }),
      catchError(() => of(undefined)),
    );
  }

  private fromServer(row: ServerCartRow): CartLine {
    const product = row.Product;
    const variant = row.ProductVariant;
    return {
      row_id: row.id,
      product_id: row.product_id,
      public_id: product?.public_id || '',
      variant_id: row.variant_id,
      variant_name: variant?.variant_name ?? null,
      name: product?.name || 'Product',
      price: Number(variant?.selling_price ?? product?.selling_price) || 0,
      mrp: Number(variant?.mrp ?? product?.mrp) || 0,
      image_url: variant?.image_url || product?.image_url || null,
      quantity: Number(row.quantity) || 1,
    };
  }

  private keyOf(productId: number, variantId: number | null): string {
    return `${productId}:${variantId ?? ''}`;
  }

  private guestKey(): string {
    return `cart:${this.shop.slug || 'default'}`;
  }

  private readGuest(): CartLine[] {
    try {
      const raw = localStorage.getItem(this.guestKey());
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeGuest(lines: CartLine[]): void {
    try {
      if (lines.length) localStorage.setItem(this.guestKey(), JSON.stringify(lines));
      else localStorage.removeItem(this.guestKey());
    } catch {
      // storage blocked: the in-memory cart still works this session
    }
  }
}

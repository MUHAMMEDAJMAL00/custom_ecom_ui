import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartLine } from '../../core/models/customer.model';
import { CartService } from '../../core/services/cart.service';
import { CustomerAuthService } from '../../core/services/customer-auth.service';
import { ShopContextService } from '../../core/services/shop-context.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { resolveImageUrl } from '../../core/utils/image.util';

/** /cart — guest and signed-in cart, editable quantities and a live summary. */
@Component({
  selector: 'app-cart-page',
  standalone: false,
  templateUrl: './cart-page.component.html',
  styleUrls: ['./cart-page.component.scss'],
})
export class CartPageComponent implements OnInit {
  currency = 'INR';
  wishlistEnabled = false;

  constructor(
    readonly cart: CartService,
    readonly auth: CustomerAuthService,
    private shop: ShopContextService,
    private wishlist: WishlistService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.shop.load().subscribe((ctx) => {
      this.currency = ctx.bootstrap.tenant.currency || 'INR';
      this.wishlistEnabled = ctx.bootstrap.features['wishlist'] === true;
    });
  }

  image(line: CartLine): string {
    return resolveImageUrl(line.image_url);
  }

  subtotal(lines: CartLine[]): number {
    return lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  }

  savings(lines: CartLine[]): number {
    return lines.reduce((sum, line) => sum + Math.max(0, line.mrp - line.price) * line.quantity, 0);
  }

  count(lines: CartLine[]): number {
    return lines.reduce((sum, line) => sum + line.quantity, 0);
  }

  changeQty(line: CartLine, delta: number): void {
    this.cart.updateQuantity(line, line.quantity + delta);
  }

  setQty(line: CartLine, value: string | number): void {
    const qty = Number(value);
    if (Number.isFinite(qty)) this.cart.updateQuantity(line, qty);
  }

  remove(line: CartLine): void {
    this.cart.remove(line);
  }

  moveToWishlist(line: CartLine): void {
    this.wishlist.toggle({
      id: line.product_id,
      public_id: line.public_id,
      name: line.name,
      selling_price: line.price,
      mrp: line.mrp,
      image_url: line.image_url,
    });
    this.cart.remove(line);
  }

  checkout(): void {
    if (!this.cart.lines.length) return;
    if (!this.auth.isLoggedIn) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout' } });
      return;
    }
    void this.router.navigate(['/checkout']);
  }
}

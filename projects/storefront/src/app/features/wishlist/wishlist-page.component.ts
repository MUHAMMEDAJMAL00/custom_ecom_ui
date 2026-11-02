import { Component, OnInit } from '@angular/core';
import { WishlistLine } from '../../core/models/customer.model';
import { CartService } from '../../core/services/cart.service';
import { ShopContextService } from '../../core/services/shop-context.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { resolveImageUrl } from '../../core/utils/image.util';

/** /wishlist — saved products, moved to the cart in one click. */
@Component({
  selector: 'app-wishlist-page',
  standalone: false,
  templateUrl: './wishlist-page.component.html',
  styleUrls: ['./wishlist-page.component.scss'],
})
export class WishlistPageComponent implements OnInit {
  currency = 'INR';

  constructor(
    readonly wishlist: WishlistService,
    private cart: CartService,
    private shop: ShopContextService,
  ) {}

  ngOnInit(): void {
    this.shop.load().subscribe((ctx) => (this.currency = ctx.bootstrap.tenant.currency || 'INR'));
  }

  image(item: WishlistLine): string {
    return resolveImageUrl(item.image_url);
  }

  addToCart(item: WishlistLine): void {
    this.cart.add(
      {
        id: item.product_id,
        public_id: item.public_id,
        name: item.name,
        selling_price: item.price,
        mrp: item.mrp,
        image_url: item.image_url,
      },
      null,
      1,
    );
  }
}

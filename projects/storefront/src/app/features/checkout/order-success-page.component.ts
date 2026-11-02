import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CustomerOrder } from '../../core/models/customer.model';
import { CustomerAuthService } from '../../core/services/customer-auth.service';
import { CustomerOrderService } from '../../core/services/customer-order.service';
import { ShopContextService } from '../../core/services/shop-context.service';

/** /checkout/success/:id — confirmation after an order is placed. */
@Component({
  selector: 'app-order-success-page',
  standalone: false,
  templateUrl: './order-success-page.component.html',
  styleUrls: ['./order-success-page.component.scss'],
})
export class OrderSuccessPageComponent implements OnInit {
  order: CustomerOrder | null = null;
  loading = true;
  error = '';
  currency = 'INR';
  shopName = '';

  constructor(
    private route: ActivatedRoute,
    private orders: CustomerOrderService,
    private shop: ShopContextService,
  ) {}

  ngOnInit(): void {
    this.shop.load().subscribe((ctx) => {
      this.currency = ctx.bootstrap.tenant.currency || 'INR';
      this.shopName = ctx.bootstrap.tenant.name;
    });
    const id = this.route.snapshot.paramMap.get('id') || '';
    this.orders.order(id).subscribe({
      next: (order) => {
        this.order = order;
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.error = CustomerAuthService.errorMessage(err, 'Could not load your order.');
      },
    });
  }

  get paymentMethod(): string {
    return this.order?.payments?.[0]?.payment_method || '—';
  }
}

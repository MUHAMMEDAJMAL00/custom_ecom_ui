import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { CustomerOrder } from '../../core/models/customer.model';
import { CustomerAuthService } from '../../core/services/customer-auth.service';
import { CustomerOrderService, OrderPage } from '../../core/services/customer-order.service';
import { ShopContextService } from '../../core/services/shop-context.service';

/** /my-orders — the signed-in customer's online orders. */
@Component({
  selector: 'app-orders-page',
  standalone: false,
  templateUrl: './orders-page.component.html',
  styleUrls: ['./orders-page.component.scss'],
})
export class OrdersPageComponent implements OnInit {
  page: OrderPage = { total: 0, page: 1, limit: 10, total_pages: 1, data: [] };
  status = '';
  loading = true;
  error = '';
  currency = 'INR';

  readonly tabs = [
    { value: '', label: 'All orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  constructor(
    readonly auth: CustomerAuthService,
    private orders: CustomerOrderService,
    private shop: ShopContextService,
  ) {}

  ngOnInit(): void {
    this.shop.load().subscribe((ctx) => (this.currency = ctx.bootstrap.tenant.currency || 'INR'));
    this.load(1);
  }

  load(page = 1): void {
    this.loading = true;
    this.error = '';
    this.orders.myOrders(page, this.status).subscribe({
      next: (result) => {
        this.page = result;
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.error = CustomerAuthService.errorMessage(err, 'Could not load your orders.');
      },
    });
  }

  filter(status: string): void {
    this.status = status;
    this.load(1);
  }

  itemCount(order: CustomerOrder): number {
    return (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  }

  orderDate(order: CustomerOrder): string | null {
    return order.created_at || order.createdAt || order.sale_date || null;
  }

  pages(): number[] {
    const total = Math.min(this.page.total_pages, 8);
    return Array.from({ length: total }, (_, index) => index + 1);
  }
}

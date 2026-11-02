import { localDate } from '../../../../core/utils/date.util';
import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../../core/services/api.service';
import { NotificationService } from '../../../../core/services/notification.service';

interface SettlementRow {
  seller_id: number;
  business_name: string;
  status: string;
  orders: number;
  gross: number;
  commission: number;
  earnings: number;
  paid: number;
  in_payout: number;
  unsettled: number;
}

const isoDate = (d: Date) => localDate(d);

/** Per-seller settlement summary (GET /sellers/reports/settlement). */
@Component({
  selector: 'app-seller-settlement',
  standalone: false,
  templateUrl: './seller-settlement.component.html',
  styleUrl: './seller-settlement.component.css',
})
export class SellerSettlementComponent implements OnInit {
  from = isoDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  to = isoDate(new Date());
  rows: SettlementRow[] = [];
  totals: Omit<SettlementRow, 'seller_id' | 'business_name' | 'status'> | null = null;
  loading = false;

  constructor(private api: ApiService, private notify: NotificationService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    if (this.from > this.to) {
      this.notify.warning('"From" date must be on or before "To" date');
      return;
    }
    this.loading = true;
    this.api
      .get<{ data: SettlementRow[]; totals: any }>('/sellers/reports/settlement', { from: this.from, to: this.to })
      .pipe(map((res) => res.data))
      .subscribe({
        next: (report) => {
          this.rows = report.data;
          this.totals = report.totals;
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          this.notify.error(err.error?.message || 'Could not load the settlement report');
        },
      });
  }

  exportCsv(): void {
    const header = ['Seller', 'Status', 'Orders', 'Gross', 'Commission', 'Seller earnings', 'Paid', 'In payout', 'Unsettled'];
    const lines = this.rows.map((r) => [r.business_name, r.status, r.orders, r.gross, r.commission, r.earnings, r.paid, r.in_payout, r.unsettled]);
    const cell = (v: unknown) => {
      let text = String(v ?? '');
      // A leading = + - @ would run as a formula when the file is opened in Excel
      if (typeof v === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
      return `"${text.replace(/"/g, '""')}"`;
    };
    const csv = [header, ...lines].map((row) => row.map(cell).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `seller-settlement-${this.from}-to-${this.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

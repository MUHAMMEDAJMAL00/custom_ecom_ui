import { localDate } from '../../../../core/utils/date.util';
import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../../../core/services/notification.service';
import { GstDashboardService } from '../../services/gst-dashboard.service';

@Component({
  selector: 'app-gst-dashboard-list',
  standalone: false,
  templateUrl: './gst-dashboard-list.component.html',
  styleUrl: './gst-dashboard-list.component.css',
})
export class GstDashboardListComponent implements OnInit {
  dateFrom = '';
  dateTo = '';
  activeTab = 'slabs';
  loading = false;

  summaryData: any = null;
  gstr1Data: any = null;

  constructor(private service: GstDashboardService, private notify: NotificationService) {}

  ngOnInit(): void {
    this.setPeriod('month');
  }

  setPeriod(p: string): void {
    const now = new Date();
    let from: Date, to: Date;
    switch (p) {
      case 'today': from = to = now; break;
      case 'week': { const d = now.getDay(); from = new Date(now); from.setDate(now.getDate() - d); to = now; break; }
      case 'month': from = new Date(now.getFullYear(), now.getMonth(), 1); to = new Date(now.getFullYear(), now.getMonth() + 1, 0); break;
      case 'quarter': { const q = Math.floor(now.getMonth() / 3); from = new Date(now.getFullYear(), q * 3, 1); to = new Date(now.getFullYear(), (q + 1) * 3, 0); break; }
      default: return;
    }
    this.dateFrom = localDate(from);
    this.dateTo = localDate(to);
    this.generateReport();
  }

  generateReport(): void {
    if (!this.dateFrom || !this.dateTo) { this.notify.warning('Select both dates'); return; }
    this.loading = true;
    this.service.getSummary({ from_date: this.dateFrom, to_date: this.dateTo }).subscribe({
      next: (data: any) => {
        this.summaryData = data;
        this.loading = false;
        if (this.isFullMonth()) this.fetchGstr1();
      },
      error: () => { this.loading = false; this.notify.error('Failed to generate report'); },
    });
  }

  isFullMonth(): boolean {
    const f = new Date(this.dateFrom), t = new Date(this.dateTo);
    const lastDay = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();
    return f.getDate() === 1 && t.getDate() === lastDay && f.getMonth() === t.getMonth();
  }

  fetchGstr1(): void {
    const d = new Date(this.dateFrom);
    this.service.getGstr1({ month: d.getMonth() + 1, year: d.getFullYear() }).subscribe({
      next: (data: any) => { this.gstr1Data = data; },
      error: () => {},
    });
  }

  get slabs(): any[] {
    const s = this.summaryData?.slabs || {};
    const rates = ['0', '5', '12', '18', '28'];
    const result: any[] = [];
    rates.forEach((rate) => {
      const r = s[rate] || { taxable: 0, cgst: 0, sgst: 0, igst: 0 };
      if (r.taxable > 0 || r.cgst > 0 || r.sgst > 0 || r.igst > 0) {
        result.push({ rate, taxable: r.taxable || 0, cgst: r.cgst || 0, sgst: r.sgst || 0, igst: r.igst || 0, totalTax: (r.cgst || 0) + (r.sgst || 0) + (r.igst || 0) });
      }
    });
    return result;
  }

  get itcSlabs(): any[] {
    const s = this.summaryData?.purchase_slabs || {};
    const rates = ['0', '5', '12', '18', '28'];
    const result: any[] = [];
    rates.forEach((rate) => {
      const r = s[rate] || { taxable: 0, cgst: 0, sgst: 0, igst: 0 };
      if (r.taxable > 0 || r.cgst > 0 || r.sgst > 0 || r.igst > 0) {
        result.push({ rate, taxable: r.taxable || 0, cgst: r.cgst || 0, sgst: r.sgst || 0, igst: r.igst || 0, totalTax: (r.cgst || 0) + (r.sgst || 0) + (r.igst || 0) });
      }
    });
    return result;
  }

  get gstr1Invoices(): any[] {
    return this.gstr1Data?.invoices || [];
  }

  get s(): any { return this.summaryData?.summary || {}; }
  get n(): any { return this.summaryData?.net_payable || {}; }
  get salesTotal(): number { return this.s.sales?.total || 0; }
  get purchasesTotal(): number { return this.s.purchases?.total || 0; }
  get netTotal(): number { return this.n.total || 0; }
  get netCgst(): number { return this.n.cgst || 0; }
  get netSgst(): number { return this.n.sgst || 0; }

  formatCurrency(n: any): string { return '₹' + Number(n || 0).toFixed(2); }
  formatDate(s: string): string { return s ? new Date(s).toLocaleDateString() : ''; }
}

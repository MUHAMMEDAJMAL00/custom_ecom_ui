import { localDate } from '../../../../core/utils/date.util';
import { Component, OnInit } from '@angular/core';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Sale, SaleStats } from '../../models/sale.model';
import { SalesService } from '../../services/sales.service';

type DrawerMode = 'view' | 'payment' | 'cancel' | null;

@Component({
  selector: 'app-sale-list',
  standalone: false,
  templateUrl: './sale-list.component.html',
  styleUrl: './sale-list.component.css',
})
export class SaleListComponent implements OnInit {
  sales: Sale[] = [];
  loading = true;
  errorMessage = '';

  page = 1;
  limit = 20;
  totalPages = 1;
  search = '';
  filterStatus = '';
  filterPaymentStatus = '';
  filterFrom = '';
  filterTo = '';
  private searchDebounce?: ReturnType<typeof setTimeout>;

  stats: SaleStats | null = null;

  drawerMode: DrawerMode = null;
  saving = false;

  viewingSale: Sale | null = null;

  payMethod = 'cash';
  payAmount: number | null = null;
  payRef = '';
  payNotes = '';

  cancelReason = '';

  constructor(
    private service: SalesService,
    private notify: NotificationService,
    private confirmService: ConfirmService,
  ) {}

  ngOnInit(): void {
    this.setTodayFilter();
    this.load(1);
    this.loadStats();
  }

  todayISO(): string {
    return localDate(new Date());
  }

  setTodayFilter(): void {
    const today = this.todayISO();
    this.filterFrom = today;
    this.filterTo = today;
  }

  load(page?: number): void {
    this.page = page ?? this.page;
    this.loading = true;
    this.errorMessage = '';
    this.service
      .getAll({
        page: this.page,
        limit: this.limit,
        search: this.search || undefined,
        status: this.filterStatus || undefined,
        payment_status: this.filterPaymentStatus || undefined,
        from: this.filterFrom || undefined,
        to: this.filterTo || undefined,
      })
      .subscribe({
        next: (res) => {
          this.sales = res.data;
          this.totalPages = res.total_pages;
          this.loading = false;
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to load sales';
          this.loading = false;
        },
      });
  }

  loadStats(): void {
    this.service
      .getStats({
        from: this.filterFrom || undefined,
        to: this.filterTo || undefined,
        status: this.filterStatus || undefined,
      })
      .subscribe({
        next: (stats) => (this.stats = stats),
        error: () => (this.stats = null),
      });
  }

  onSearchInput(value: string): void {
    this.search = value;
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.load(1);
      this.loadStats();
    }, 250);
  }

  applyFilter(): void {
    this.load(1);
    this.loadStats();
  }

  clearFilters(): void {
    this.search = '';
    this.filterStatus = '';
    this.filterPaymentStatus = '';
    this.setTodayFilter();
    this.applyFilter();
  }

  refresh(): void {
    this.load();
    this.loadStats();
  }

  onLimitChange(limit: number): void {
    this.limit = limit;
    this.load(1);
  }

  formatCurrency(n: number | string): string {
    return '₹' + parseFloat(String(n || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  absVal(n: number | string | undefined): number {
    return Math.abs(parseFloat(String(n || 0)));
  }

  formatCompact(n: number): string {
    if (n >= 10000000) return '₹' + (n / 10000000).toFixed(1) + 'Cr';
    if (n >= 100000) return '₹' + (n / 100000).toFixed(1) + 'L';
    return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  }

  formatDate(s: string, withTime = true): string {
    if (!s) return '—';
    const d = new Date(s);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-IN', withTime
      ? { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }
      : { day: '2-digit', month: 'short', year: 'numeric' });
  }

  statusBadgeClass(s: string): string {
    const map: Record<string, string> = {
      completed: 'badge-completed',
      draft: 'badge-inactive',
      cancelled: 'badge-cancelled',
      returned: 'badge-refunded',
      partial_return: 'badge-pending',
    };
    return map[s] || 'badge-inactive';
  }

  paymentBadgeClass(s: string): string {
    const map: Record<string, string> = {
      paid: 'badge-completed',
      partial: 'badge-pending',
      unpaid: 'badge-cancelled',
      refunded: 'badge-refunded',
    };
    return map[s] || '';
  }

  // ── View ──
  openView(item: Sale): void {
    this.viewingSale = null;
    this.drawerMode = 'view';
    this.service.getById(item.id).subscribe({
      next: (sale) => (this.viewingSale = sale),
      error: () => {
        this.notify.error('Failed to load sale details');
        this.closeDrawer();
      },
    });
  }

  // ── Print ──
  printInvoice(): void {
    const content = this.buildInvoiceHtml();
    const w = window.open('', '_blank', 'width=520,height=680');
    if (!w) return;
    w.document.write(
      '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice</title>' +
        '<style>' + this.printCss() + '</style></head><body>' +
        content +
        '<p style="text-align:center;color:#9c8b91;font-size:9px;margin-top:14px">Printed on ' + new Date().toLocaleString('en-IN') + '</p>' +
        '</body></html>',
    );
    w.document.close();
    w.focus();
    setTimeout(() => {
      w.print();
      w.close();
    }, 400);
  }

  private printCss(): string {
    return '*{box-sizing:border-box;margin:0;padding:0}' +
      'body{font-family:-apple-system,Segoe UI,system-ui,sans-serif;font-size:13px;color:#2a1a20;padding:20px;max-width:520px;margin:0 auto}' +
      '@media print{body{padding:0;max-width:100%}}' +
      '.inv-wrapper{background:#fff;border-radius:12px;overflow:hidden;border:1px solid #f6e7e9}' +
      '.inv-accent-bar{height:4px;background:#c8102e}' +
      '.inv-header{display:flex;justify-content:space-between;align-items:flex-start;padding:22px 24px 16px;border-bottom:1px solid #f6e7e9}' +
      '.inv-brand{display:flex;align-items:center;gap:12px}' +
      '.inv-logo-box{width:44px;height:44px;background:#c8102e;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff}' +
      '.inv-logo-box svg{width:22px;height:22px}' +
      '.inv-brand-info{display:flex;flex-direction:column;gap:2px}' +
      '.inv-store{font-weight:800;font-size:15px;color:#2a1a20}' +
      '.inv-meta{font-size:10px;color:#6b5a60}' +
      '.inv-doc-title{font-size:22px;font-weight:200;color:#2a1a20;letter-spacing:.04em;padding-top:2px}' +
      '.inv-body{padding:0 24px}' +
      '.inv-info-row{display:flex;gap:14px;margin:18px 0}' +
      '.inv-info-block{flex:1;background:#fdf4f5;border:1px solid #f6e7e9;border-radius:10px;padding:12px 14px}' +
      '.inv-info-title{font-size:9px;color:#9c8b91;text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin-bottom:8px}' +
      '.inv-info-bold{font-weight:700;font-size:13px;color:#2a1a20}' +
      '.inv-info-text{font-size:11px;color:#4b5563;margin-top:2px}' +
      '.inv-info-label{color:#9c8b91;font-weight:600;font-size:10px}' +
      '.inv-line-items{width:100%;border-collapse:collapse;margin-bottom:16px}' +
      '.inv-line-items th{font-size:9px;color:#9c8b91;text-transform:uppercase;font-weight:700;padding:9px 10px;background:#fdf4f5;border-top:1px solid #f6e7e9;border-bottom:2px solid #efd6da;text-align:left}' +
      '.inv-line-items td{padding:10px;border-bottom:1px solid #f6e7e9;vertical-align:top;font-size:12px}' +
      '.inv-line-items tr:last-child td{border-bottom:2px solid #efd6da}' +
      '.inv-sku{display:inline-block;font-size:9px;color:#9c8b91;background:#f6e7e9;border-radius:3px;padding:1px 5px;margin-top:2px}' +
      '.inv-right{text-align:right;font-variant-numeric:tabular-nums}' +
      '.inv-center{text-align:center}' +
      '.inv-bold{font-weight:700}' +
      '.inv-green{color:#16a34a;font-weight:600}' +
      '.inv-footer-section{display:flex;gap:20px;padding:14px 16px;background:#fdf4f5;border-radius:10px;border:1px solid #f6e7e9;margin-bottom:16px}' +
      '.inv-message{flex:1;font-size:10px;color:#6b5a60}' +
      '.inv-message p{margin:0 0 2px}' +
      '.inv-message-icon{font-weight:700;font-size:10px;color:#9c8b91;text-transform:uppercase;margin-bottom:6px}' +
      '.inv-total-box{width:180px;border:1px solid #efd6da;border-radius:10px;padding:10px 12px;background:#fff}' +
      '.inv-total-row{display:flex;justify-content:space-between;padding:4px 0;font-size:11px}' +
      '.inv-total-row span:first-child{color:#6b5a60}' +
      '.inv-total-row span:last-child{font-weight:600}' +
      '.inv-total-divider{height:1px;background:#efd6da;margin:7px 0}' +
      '.inv-grand-total{font-size:12px;font-weight:800;color:#2a1a20}' +
      '.inv-grand-total span:last-child{font-size:14px;color:#c8102e}' +
      '.inv-due-row{margin-top:4px;padding-top:6px;border-top:1px dashed #efd6da;font-weight:700;font-size:10px}' +
      '.inv-payments-block{margin:0 24px 16px}' +
      '.inv-payments-header{font-size:9px;color:#9c8b91;text-transform:uppercase;font-weight:700;margin-bottom:8px}' +
      '.inv-payments-list{display:flex;flex-wrap:wrap;gap:6px}' +
      '.inv-payment-badge{display:inline-flex;gap:6px;padding:6px 10px;background:#fdf4f5;border:1px solid #efe0e3;border-radius:8px;font-size:10px;font-weight:600;color:#c8102e}' +
      '.inv-internal{margin:0 24px 16px;padding:12px 14px;background:#fffbf0;border:1px solid #fef3c7;border-radius:10px}' +
      '.inv-internal-title{font-size:9px;color:#b45309;text-transform:uppercase;font-weight:700;margin-bottom:8px}' +
      '.inv-internal .inv-total-box{width:100%;box-shadow:none;border:1px solid #fef3c7}' +
      '.badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:12px;font-size:9px;font-weight:600}' +
      '.badge-completed{background:#dcfce7;color:#16a34a}' +
      '.badge-inactive{background:#f6e7e9;color:#6b5a60}' +
      '.badge-cancelled{background:#fee2e2;color:#dc2626}' +
      '.badge-refunded{background:#e0e7ff;color:#6366f1}';
  }

  private esc(s: unknown): string {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  private buildInvoiceHtml(): string {
    const item = this.viewingSale;
    if (!item) return '';
    const cname = item.Customer?.name || 'Walk-in';
    const cphone = item.Customer?.phone || '';
    const due = parseFloat(String(item.due_amount || 0));
    const saleItems = item.items || [];

    const itemsRows = saleItems.length
      ? saleItems
          .map((si) => {
            const pSku = si.product_sku || si.Product?.sku || '';
            return (
              '<tr>' +
              '<td>' + this.esc(si.product_name) + (pSku ? ' <small class="inv-sku">' + this.esc(pSku) + '</small>' : '') + '</td>' +
              '<td class="inv-center">' + this.esc(String(si.quantity)) + '</td>' +
              '<td class="inv-right">' + this.formatCurrency(si.unit_price) + '</td>' +
              '<td class="inv-right">' + (si.tax_rate ? si.tax_rate + '%' : '—') + '</td>' +
              '<td class="inv-right">' + this.formatCurrency(si.tax_amount) + '</td>' +
              '<td class="inv-right inv-bold">' + this.formatCurrency(si.total_price) + '</td>' +
              '</tr>'
            );
          })
          .join('')
      : '<tr><td colspan="5" class="tbl-empty">No items</td></tr>';

    const taxRows = item.tax_breakdown && item.tax_breakdown.length
      ? item.tax_breakdown.map((tb) => '<div class="inv-total-row" style="font-size:11px;color:#6b5a60"><span>' + this.esc(tb.name) + (tb.rate ? ' @ ' + tb.rate + '%' : '') + '</span><span class="inv-right">' + this.formatCurrency(tb.amount) + '</span></div>').join('') +
        '<div class="inv-total-row" style="font-weight:600"><span>' + (item.invoice_tax_mode === 'invoice' ? 'Invoice Tax' : 'Total Tax') + '</span><span class="inv-right">' + this.formatCurrency(item.tax_amount) + '</span></div>'
      : '<div class="inv-total-row"><span>' + (item.invoice_tax_mode === 'invoice' ? 'Invoice Tax' : 'Tax') + '</span><span class="inv-right">' + this.formatCurrency(item.tax_amount) + '</span></div>';

    const paymentsBlock = item.payments && item.payments.length
      ? '<div class="inv-payments-block"><div class="inv-payments-header">Payments Received</div><div class="inv-payments-list">' +
        item.payments.map((p) => '<div class="inv-payment-badge"><span>' + this.esc(p.payment_source_name || p.payment_method) + '</span><span class="inv-bold">' + this.formatCurrency(p.amount) + '</span></div>').join('') +
        '</div></div>'
      : '';

    const profitVal = parseFloat(String(item.total_profit || 0));
    const profitColor = profitVal >= 0 ? '#16a34a' : '#ef4444';
    const internalBlock = parseFloat(String(item.total_cost || 0)) > 0
      ? '<div class="inv-internal"><div class="inv-internal-title">Internal — Cost &amp; Profit</div><div class="inv-total-box">' +
        '<div class="inv-total-row"><span>Total Cost</span><span class="inv-right">' + this.formatCurrency(item.total_cost) + '</span></div>' +
        '<div class="inv-total-row" style="color:' + profitColor + '"><span>Net Profit</span><span class="inv-right inv-bold">' + (profitVal >= 0 ? '+' : '-') + this.formatCurrency(Math.abs(profitVal)) + '</span></div>' +
        '</div></div>'
      : '';

    return (
      '<div class="inv-wrapper"><div class="inv-accent-bar"></div>' +
      '<div class="inv-header"><div class="inv-brand"><div class="inv-logo-box">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>' +
      '</div><div class="inv-brand-info"><div class="inv-store">' + this.esc(item.Store?.name || 'Your Company') + '</div>' +
      '<div class="inv-meta">' + this.esc(item.Store?.code || 'Address, City, State') + '</div></div></div>' +
      '<div class="inv-doc-title">INVOICE</div></div>' +
      '<div class="inv-body">' +
      '<div class="inv-info-row"><div class="inv-info-block"><div class="inv-info-title">Bill To</div>' +
      '<div class="inv-info-bold">' + this.esc(cname) + '</div>' + (cphone ? '<div class="inv-info-text">' + this.esc(cphone) + '</div>' : '') + '</div>' +
      '<div class="inv-info-block"><div class="inv-info-title">Details</div>' +
      '<div class="inv-info-text"><span class="inv-info-label">Invoice #</span>' + this.esc(item.invoice_number) + '</div>' +
      '<div class="inv-info-text"><span class="inv-info-label">Date</span>' + this.formatDate(item.sale_date) + '</div>' +
      '<div class="inv-info-text"><span class="inv-info-label">Status</span><span class="badge ' + this.statusBadgeClass(item.status) + '">' + item.status + '</span></div>' +
      '<div class="inv-info-text"><span class="inv-info-label">Cashier</span>' + this.esc(item.User?.name || '—') + '</div></div></div>' +
      '<table class="inv-line-items"><thead><tr><th style="width:38%">Product / Service</th><th class="inv-center">Qty</th><th class="inv-right">Rate</th><th class="inv-right">Tax Rate</th><th class="inv-right">Tax</th><th class="inv-right">Amount</th></tr></thead>' +
      '<tbody>' + itemsRows + '</tbody></table>' +
      '<div class="inv-footer-section"><div class="inv-message"><div class="inv-message-icon">Thank You</div><p>We appreciate your business.</p><p>For any queries, please contact support.</p></div>' +
      '<div class="inv-total-box">' +
      '<div class="inv-total-row"><span>Subtotal</span><span class="inv-right">' + this.formatCurrency(item.subtotal) + '</span></div>' +
      '<div class="inv-total-row"><span>Discount</span><span class="inv-right inv-green">-' + this.formatCurrency(item.discount_amount) + '</span></div>' +
      taxRows +
      '<div class="inv-total-divider"></div>' +
      '<div class="inv-total-row inv-grand-total"><span>Grand Total</span><span class="inv-right">' + this.formatCurrency(item.total_amount) + '</span></div>' +
      '<div class="inv-due-row"><span>Balance Due</span><span class="inv-right" style="color:' + (due > 0 ? '#ef4444' : '#6b5a60') + '">' + this.formatCurrency(due) + '</span></div>' +
      '</div></div>' +
      paymentsBlock +
      internalBlock +
      '</div></div>'
    );
  }

  // ── Add payment ──
  openAddPayment(): void {
    if (!this.viewingSale) return;
    this.payMethod = 'cash';
    this.payAmount = parseFloat(String(this.viewingSale.due_amount || 0));
    this.payRef = '';
    this.payNotes = '';
    this.drawerMode = 'payment';
  }

  submitPayment(): void {
    if (!this.viewingSale) return;
    const maxDue = parseFloat(String(this.viewingSale.due_amount || 0));
    if (!this.payAmount || this.payAmount <= 0) {
      this.notify.warning('Enter a valid amount');
      return;
    }
    if (this.payAmount > maxDue + 0.01) {
      this.notify.warning('Amount exceeds due: ' + this.formatCurrency(maxDue));
      return;
    }
    this.saving = true;
    this.service
      .addPayment(this.viewingSale.id, {
        payment_method: this.payMethod,
        amount: this.payAmount,
        reference_number: this.payRef.trim() || null,
        notes: this.payNotes.trim() || null,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.notify.success('Payment recorded successfully');
          this.closeDrawer();
          this.load();
          this.loadStats();
        },
        error: (err) => {
          this.saving = false;
          this.notify.error(err.error?.message || 'Failed');
        },
      });
  }

  // ── Cancel sale ──
  openCancelSale(): void {
    this.cancelReason = '';
    this.drawerMode = 'cancel';
  }

  submitCancel(): void {
    if (!this.viewingSale) return;
    const reason = this.cancelReason.trim();
    if (!reason) {
      this.notify.warning('Please enter a reason for cancellation');
      return;
    }
    this.saving = true;
    this.service.cancel(this.viewingSale.id, reason).subscribe({
      next: () => {
        this.saving = false;
        this.notify.success('Sale cancelled');
        this.closeDrawer();
        this.load();
        this.loadStats();
      },
      error: (err) => {
        this.saving = false;
        this.notify.error(err.error?.message || 'Failed');
      },
    });
  }

  get drawerTitle(): string {
    if (this.drawerMode === 'payment') return 'Add Payment to Sale';
    if (this.drawerMode === 'cancel') return 'Cancel Sale';
    return 'Invoice';
  }

  closeDrawer(): void {
    this.drawerMode = null;
    this.viewingSale = null;
  }

  handleSave(): void {
    if (this.drawerMode === 'payment') this.submitPayment();
    else if (this.drawerMode === 'cancel') this.submitCancel();
  }
}

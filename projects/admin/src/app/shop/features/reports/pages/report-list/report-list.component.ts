import { localDate } from '../../../../core/utils/date.util';
import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../../../core/services/notification.service';
import { ReportsService } from '../../services/reports.service';

type ColDef = { key: string; label: string; render?: (v: any, r: any, i: number) => string };

/**
 * Cells are rendered with [innerHTML] so columns can add markup (badges, bars). Every
 * string that came from the database is HTML-escaped first, so product, customer or
 * return text can never inject markup into the page.
 */
const escapeHtml = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function escapeDeep(value: any): any {
  if (typeof value === 'string') return escapeHtml(value);
  if (Array.isArray(value)) return value.map(escapeDeep);
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, escapeDeep(v)]));
  }
  return value;
}

const escapeRows = (rows: any[]) => (rows || []).map(escapeDeep);

@Component({
  selector: 'app-report-list',
  standalone: false,
  templateUrl: './report-list.component.html',
  styleUrl: './report-list.component.css',
})
export class ReportListComponent implements OnInit {
  activeReport = '';
  acctReports = ['trial-balance', 'balance-sheet', 'ar-aging', 'ap-aging'];
  dateFrom = '';
  dateTo = '';
  loading = false;

  statCards: { label: string; value: string; icon: string; color: string; sub?: string }[] = [];
  tableColumns: ColDef[] = [];
  tableData: any[] = [];
  tableTitle = '';
  tableMeta = '';
  showTable = false;

  table2Columns: ColDef[] = [];
  table2Data: any[] = [];
  table2Title = '';
  showTable2 = false;

  constructor(private service: ReportsService, private notify: NotificationService) {}

  ngOnInit(): void {
    const now = new Date();
    const from = new Date(now); from.setDate(from.getDate() - 30);
    this.dateFrom = localDate(from);
    this.dateTo = localDate(now);
  }

  selectReport(report: string): void {
    this.activeReport = report;
    this.loadReport();
  }

  setPeriod(label: string): void {
    const now = new Date();
    let from: Date, to: Date;
    switch (label) {
      case 'today': from = to = now; break;
      case 'week': { const d = now.getDay(); from = new Date(now); from.setDate(now.getDate() - d); to = now; break; }
      case 'month': from = new Date(now.getFullYear(), now.getMonth(), 1); to = new Date(now.getFullYear(), now.getMonth() + 1, 0); break;
      case 'year': from = new Date(now.getFullYear(), 0, 1); to = new Date(now.getFullYear(), 11, 31); break;
      default: return;
    }
    this.dateFrom = localDate(from);
    this.dateTo = localDate(to);
    this.loadReport();
  }

  loadReport(): void {
    if (!this.activeReport || !this.dateFrom || !this.dateTo) return;
    this.loading = true;
    this.showTable = false;
    this.showTable2 = false;
    this.statCards = [];

    const path = this.activeReport === 'gst-summary' ? 'gst-summary' : this.activeReport;
    this.service.get(path, { from: this.dateFrom, to: this.dateTo }).subscribe({
      next: (r: any) => {
        const data = r.data || r;
        this.renderReport(data);
        this.loading = false;
      },
      error: (err: any) => { this.notify.error(err.error?.message || 'Failed to load report'); this.loading = false; },
    });
  }

  renderReport(data: any): void {
    switch (this.activeReport) {
      case 'sales': this.renderSales(data); break;
      case 'purchases': this.renderPurchases(data); break;
      case 'profit-loss': this.renderPL(data); break;
      case 'top-products': this.renderTopProducts(data); break;
      case 'top-customers': this.renderTopCustomers(data); break;
      case 'inventory': this.renderInventory(data); break;
      case 'returns': this.renderReturns(data); break;
      case 'gst-summary': this.renderGSTSummary(data); break;
      case 'trial-balance': this.renderTrialBalance(data); break;
      case 'balance-sheet': this.renderBalanceSheet(data); break;
      case 'ar-aging': this.renderARAging(data); break;
      case 'ap-aging': this.renderAPAging(data); break;
    }
  }

  // ── Render helpers ──
  statCard(label: string, val: string, icon: string, color: string, sub?: string): void {
    this.statCards.push({ label, value: val, icon, color, sub });
  }

  curr(n: any): string { return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  setTable(title: string, meta: string, columns: ColDef[], data: any[]): void {
    this.tableTitle = title;
    this.tableMeta = meta;
    this.tableColumns = columns.map((c) => ({ key: c.key, label: c.label, render: c.render || ((v: any) => String(v ?? '—')) }));
    this.tableData = escapeRows(data);
    this.showTable = true;
  }

  setTable2(title: string, columns: ColDef[], data: any[]): void {
    this.table2Title = title;
    this.table2Columns = columns.map((c) => ({ key: c.key, label: c.label, render: c.render || ((v: any) => String(v ?? '—')) }));
    this.table2Data = escapeRows(data);
    this.showTable2 = true;
  }

  cellValue(r: any, col: any, i: any): string {
    return col.render ? col.render(r[col.key], r, i) : String(r[col.key] ?? '—');
  }

  // ── Sales ──
  renderSales(data: any): void {
    const s = data.summary || data;
    const profit = parseFloat(s.total_profit || 0);
    this.statCard('Total Orders', String(s.total_orders || 0), '🛒', 'dark');
    this.statCard('Total Revenue', this.curr(s.total_revenue || 0), '💰', 'teal');
    this.statCard('Total Cost', this.curr(s.total_cost || 0), '📦', 'orange');
    this.statCard('Gross Profit', this.curr(profit), profit >= 0 ? '📈' : '📉', profit >= 0 ? 'teal' : 'red');
    const rows = data.sales || [];
    if (!rows.length) return;
    this.setTable('Sales List', rows.length + ' records', [
      { key: '_sn', label: '#', render: (_, r, i) => String(i + 1) },
      { key: 'invoice_number', label: 'Invoice', render: (v) => '<code>' + (v || '—') + '</code>' },
      { key: '_cust', label: 'Customer', render: (_, r) => r.Customer?.name || 'Walk-in' },
      { key: 'total_amount', label: 'Amount', render: (v) => this.curr(v) },
      { key: 'paid_amount', label: 'Paid', render: (v) => this.curr(v) },
      { key: 'due_amount', label: 'Due', render: (v) => parseFloat(v || 0) > 0 ? '<span style="color:var(--danger);font-weight:600">' + this.curr(v) + '</span>' : this.curr(v) },
      { key: 'status', label: 'Status', render: (v) => '<span class="badge">' + (v || '—') + '</span>' },
      { key: 'sale_date', label: 'Date', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
    ], rows);
  }

  // ── Purchases ──
  renderPurchases(data: any): void {
    this.statCard('Total Purchases', String(data.total_purchases || 0), '🛍️', 'dark');
    this.statCard('Total Cost', this.curr(data.total_cost || 0), '💸', 'red');
    this.statCard('Amount Paid', this.curr(data.total_paid || 0), '✅', 'teal');
    this.statCard('Outstanding Due', this.curr(data.total_due || 0), '⏳', 'orange');
    const rows = data.purchases || [];
    if (!rows.length) return;
    this.setTable('Purchase List', rows.length + ' records', [
      { key: '_sn', label: '#', render: (_, r, i) => String(i + 1) },
      { key: 'purchase_number', label: 'PO #', render: (v) => '<code>' + (v || '—') + '</code>' },
      { key: '_vendor', label: 'Vendor', render: (_, r) => r.Vendor?.name || r.Vendor?.company || '—' },
      { key: 'total_amount', label: 'Amount', render: (v) => this.curr(v) },
      { key: 'paid_amount', label: 'Paid', render: (v) => this.curr(v) },
      { key: 'due_amount', label: 'Due', render: (v) => parseFloat(v || 0) > 0 ? '<span style="color:var(--danger);font-weight:600">' + this.curr(v) + '</span>' : this.curr(v) },
      { key: 'status', label: 'Status', render: (v) => '<span class="badge">' + (v || '—') + '</span>' },
    ], rows);
  }

  // ── P&L ──
  renderPL(data: any): void {
    const net = data.net_profit || 0;
    const revenue = data.revenue || 0;
    const expenses = data.expenses || 0;
    const margin = revenue ? ((net / revenue) * 100).toFixed(1) : '0';
    const grossProfit = revenue - expenses;
    this.statCard('Total Revenue', this.curr(revenue), '💰', 'teal', 'Income from all sources');
    this.statCard('Total Expenses', this.curr(expenses), '💸', 'red', 'All expenditure accounts');
    this.statCard('Net Profit / Loss', this.curr(net), net >= 0 ? '📈' : '📉', net >= 0 ? 'teal' : 'red', margin + '% profit margin');
    this.statCard('Gross Profit', this.curr(grossProfit), '📊', grossProfit >= 0 ? 'teal' : 'red', 'Revenue minus expenses');
    const revB = data.revenue_breakdown || [];
    const expB = data.expense_breakdown || [];
    if (revB.length) this.setTable('Revenue Breakdown', revB.length + ' accounts', [{ key: 'name', label: 'Account' }, { key: 'amount', label: 'Amount (₹)', render: (v) => '<span style="color:var(--success);font-weight:600">' + this.curr(v) + '</span>' }], revB);
    if (expB.length) this.setTable2('Expense Breakdown', [{ key: 'name', label: 'Account' }, { key: 'amount', label: 'Amount (₹)', render: (v) => '<span style="color:var(--danger);font-weight:600">' + this.curr(v) + '</span>' }], expB);
  }

  // ── Top Products ──
  renderTopProducts(list: any[]): void {
    const max = list.length ? (list[0].total_qty || 1) : 1;
    this.setTable('Top Selling Products', list.length + ' products', [
      { key: '_sn', label: '#', render: (_, r, i) => String(i + 1) },
      { key: 'product_name', label: 'Product', render: (v) => '<strong>' + (v || '—') + '</strong>' },
      { key: 'total_qty', label: 'Units Sold', render: (v) => '<strong>' + (v || 0) + '</strong>' },
      { key: 'total_revenue', label: 'Revenue', render: (v) => this.curr(v) },
      { key: '_bar', label: 'Share', render: (_, r) => { const pct = Math.round(((r.total_qty || 0) / max) * 100); return '<div style="display:flex;align-items:center;gap:8px;min-width:120px"><div style="flex:1;height:6px;background:var(--border);border-radius:3px"><div style="width:' + pct + '%;height:100%;background:var(--primary);border-radius:3px"></div></div><span style="font-size:11px;color:var(--text-muted);width:28px;text-align:right">' + pct + '%</span></div>'; } },
    ], list);
  }

  // ── Top Customers ──
  renderTopCustomers(list: any[]): void {
    this.setTable('Top Customers', list.length + ' customers', [
      { key: '_sn', label: '#', render: (_, r, i) => String(i + 1) },
      { key: '_name', label: 'Customer', render: (_, r) => '<strong>' + ((r.Customer || r).name || '—') + '</strong>' },
      { key: '_phone', label: 'Phone', render: (_, r) => (r.Customer && r.Customer.phone) || '—' },
      { key: 'total_orders', label: 'Orders' },
      { key: 'total_spent', label: 'Total Spent', render: (v) => '<strong>' + this.curr(v) + '</strong>' },
    ], list);
  }

  // ── Inventory ──
  renderInventory(list: any[]): void {
    this.setTable('Stock Report', list.length + ' products', [
      { key: '_sn', label: '#', render: (_, r, i) => String(i + 1) },
      { key: '_name', label: 'Product', render: (_, r) => r.Product?.name || '—' },
      { key: '_sku', label: 'SKU', render: (_, r) => '<code>' + (r.Product?.sku || '—') + '</code>' },
      { key: '_store', label: 'Store', render: (_, r) => r.Store?.name || '—' },
      { key: 'quantity', label: 'Stock', render: (v, r) => { const qty = parseFloat(v || 0); const alert = r.Product?.alert_quantity || 0; const color = qty <= 0 ? 'var(--danger)' : qty <= alert ? 'var(--warning)' : 'var(--success)'; return '<strong style="color:' + color + '">' + qty + '</strong>'; } },
      { key: '_val', label: 'Stock Value', render: (_, r) => { const qty = parseFloat(r.quantity || 0); const price = r.Product?.selling_price || 0; return this.curr(qty * price); } },
      { key: '_status', label: 'Status', render: (_, r) => { const qty = parseFloat(r.quantity || 0); const alert = r.Product?.alert_quantity || 0; if (qty <= 0) return 'Out of Stock'; if (qty <= alert) return 'Low'; return 'In Stock'; } },
    ], list);
  }

  // ── Returns ──
  renderReturns(data: any): void {
    this.statCard('Total Returns', String(data.total_returns || 0), '↩️', 'orange');
    this.statCard('Sales Returns', String(data.sales_returns_count || 0), '🏪', 'dark');
    this.statCard('Purchase Returns', String(data.purchase_returns_count || 0), '🏭', 'blue');
    this.statCard('Total Refund', this.curr(data.total_refund || 0), '💸', 'red');
    const rows = data.sales_returns || [];
    if (!rows.length) return;
    this.setTable('Sales Returns', rows.length + ' records', [
      { key: '_sn', label: '#', render: (_, r, i) => String(i + 1) },
      { key: 'return_number', label: 'Return #', render: (v) => '<code>' + (v || '—') + '</code>' },
      { key: 'return_reason', label: 'Reason', render: (v) => v || '—' },
      { key: 'total_amount', label: 'Refund', render: (v) => '<strong style="color:var(--danger)">' + this.curr(v) + '</strong>' },
      { key: 'status', label: 'Status', render: (v) => '<span class="badge">' + (v || '—') + '</span>' },
      { key: 'created_at', label: 'Date', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
    ], rows);
  }

  // ── GST Summary ──
  renderGSTSummary(data: any): void {
    const outputTax = data.gst_collected || data.total_output_tax || data.output_tax || 0;
    const inputTax = data.gst_input_credit || data.total_input_tax || data.input_tax || 0;
    const net = outputTax - inputTax;
    this.statCard('Output Tax (Sales)', this.curr(outputTax), '📤', 'orange', 'Tax collected on sales');
    this.statCard('Input Tax (Purchases)', this.curr(inputTax), '📥', 'blue', 'Tax on purchases');
    this.statCard('Net GST Payable', this.curr(Math.max(0, net)), '🏛️', net > 0 ? 'red' : 'teal', 'Pay to government');
    this.statCard('ITC Available', this.curr(Math.max(0, -net)), '✅', 'teal', 'Input tax credit balance');
    this.setTable('GST Summary', data.total_sales + ' sales, ' + data.total_purchases + ' purchases', [
      { key: '_label', label: 'Metric', render: (_, r) => '<strong>' + (r.label || '') + '</strong>' },
      { key: '_val', label: 'Amount (₹)', render: (_, r) => '<strong style="color:' + (r.color || 'var(--text-primary)') + '">' + this.curr(r.amount) + '</strong>' },
    ], [
      { label: 'Output Tax (Sales Collected)', amount: outputTax, color: '#f97316' },
      { label: 'Input Tax Credit (Purchases)', amount: inputTax, color: '#3b82f6' },
      { label: 'Net GST Payable', amount: Math.max(0, net), color: net > 0 ? '#ef4444' : '#059669' },
      { label: 'ITC Available', amount: Math.max(0, -net), color: '#059669' },
    ]);
  }

  // ── Trial Balance ──
  renderTrialBalance(data: any): void {
    if (data.warning) return;
    const rows = data.rows || [];
    const totDr = data.total_debit || 0;
    const totCr = data.total_credit || 0;
    if (!rows.length) return;
    const groups: any = {};
    const ORDER = ['Asset', 'Liability', 'Equity', 'Income', 'Expenditure'];
    rows.forEach((r: any) => { const g = r.group || 'Other'; if (!groups[g]) groups[g] = []; groups[g].push(r); });
    const flat: any[] = [];
    ORDER.forEach((g) => { if (groups[g]?.length) { flat.push({ _isGroup: true, _label: g }); groups[g].forEach((r: any) => flat.push(r)); } });
    flat.push({ _isTotal: true, name: 'TOTAL', debit_balance: totDr, credit_balance: totCr });
    const badge = data.balanced ? '✓ Balanced' : '✗ Out of balance';
    this.tableTitle = 'Trial Balance <span style="font-size:12px;margin-left:8px">' + badge + '</span>';
    this.tableMeta = 'All-time GL data';
    this.tableColumns = [
      { key: 'name', label: 'Account', render: (v, r) => r._isGroup ? '<span class="rpt-group">' + r._label + '</span>' : r._isTotal ? '<strong>' + v + '</strong>' : '&nbsp;&nbsp;&nbsp;' + (v || '') },
      { key: 'category', label: 'Category', render: (v, r) => r._isGroup || r._isTotal ? '' : '<span style="color:var(--text-muted);font-size:12px">' + (v || '') + '</span>' },
      { key: 'debit_balance', label: 'Debit (₹)', render: (v, r) => r._isGroup ? '' : parseFloat(v || 0) > 0 ? '<span style="color:var(--success)">' + this.curr(v) + '</span>' : r._isTotal ? '<strong style="color:var(--success)">' + this.curr(v) + '</strong>' : '<span style="color:var(--text-muted)">—</span>' },
      { key: 'credit_balance', label: 'Credit (₹)', render: (v, r) => r._isGroup ? '' : parseFloat(v || 0) > 0 ? '<span style="color:var(--danger)">' + this.curr(v) + '</span>' : r._isTotal ? '<strong style="color:var(--danger)">' + this.curr(v) + '</strong>' : '<span style="color:var(--text-muted)">—</span>' },
    ];
    this.tableData = flat;
    this.showTable = true;
  }

  // ── Balance Sheet ──
  renderBalanceSheet(data: any): void {
    if (data.warning) return;
    const assets = (data.assets?.items) || [];
    const liabilities = (data.liabilities?.items) || [];
    const equity = (data.equity?.items) || [];
    const totAssets = data.assets?.total || 0;
    const totLiab = data.liabilities?.total || 0;
    const totEquity = data.equity?.total || 0;
    const totLE = data.total_liabilities_equity || (totLiab + totEquity);
    const badge = data.balanced ? '✓ A = L + E' : '✗ Imbalanced';

    const makeCols = () => [
      { key: 'name', label: 'Account', render: (v: any, r: any) => r._isGroup ? '<span class="rpt-group">' + r._label + '</span>' : r._isTotal ? '<strong>' + v + '</strong>' : '&nbsp;&nbsp;&nbsp;' + (v || '') },
      { key: 'category', label: 'Category', render: (v: any, r: any) => r._isGroup || r._isTotal ? '' : '<span style="color:var(--text-muted);font-size:12px">' + (v || '') + '</span>' },
      { key: 'balance', label: 'Balance (₹)', render: (v: any, r: any) => r._isGroup ? '' : r._isTotal ? '<strong style="color:var(--primary)">' + this.curr(v) + '</strong>' : this.curr(v) },
    ];

    const assetFlat = [{ _isGroup: true, _label: 'Assets' } as any].concat(assets).concat([{ _isTotal: true, name: 'TOTAL ASSETS', balance: totAssets } as any]);
    this.tableTitle = 'Assets <span style="font-size:12px;margin-left:8px">' + badge + '</span>';
    this.tableMeta = 'As of today';
    this.tableColumns = makeCols();
    this.tableData = assetFlat;
    this.showTable = true;

    const leFlat = [{ _isGroup: true, _label: 'Liabilities' } as any].concat(liabilities).concat([{ _isGroup: true, _label: 'Equity' } as any]).concat(equity).concat([{ _isTotal: true, name: 'TOTAL L + E', balance: totLE } as any]);
    this.table2Title = 'Liabilities & Equity';
    this.table2Columns = makeCols();
    this.table2Data = leFlat;
    this.showTable2 = true;
  }

  // ── AR Aging ──
  renderARAging(data: any): void {
    const s = data.summary || {};
    const rows = data.rows || [];
    const total = data.total_due || 0;
    this.statCard('Total Outstanding', this.curr(total), '💰', 'teal', rows.length + ' overdue invoices');
    this.statCard('Current', this.curr(s.current || 0), '✅', 'teal');
    this.statCard('1–30 Days', this.curr(s.days_1_30 || 0), '📅', 'blue');
    this.statCard('31–60 Days', this.curr(s.days_31_60 || 0), '⚠️', 'orange');
    this.statCard('61–90+ Days', this.curr((s.days_61_90 || 0) + (s.over_90 || 0)), '🚨', 'red');
    if (!rows.length) return;
    this.setTable('AR Aging — Outstanding: ' + this.curr(total), rows.length + ' invoices', [
      { key: 'invoice_number', label: 'Invoice', render: (v) => '<code>' + (v || '—') + '</code>' },
      { key: '_cust', label: 'Customer', render: (_, r) => r.customer?.name || 'Walk-in' },
      { key: 'sale_date', label: 'Sale Date', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
      { key: 'due_amount', label: 'Due (₹)', render: (v) => '<strong style="color:var(--danger)">' + this.curr(v) + '</strong>' },
      { key: 'days_overdue', label: 'Days Overdue', render: (v) => { const d = parseInt(v || 0); if (d <= 0) return 'Current'; if (d <= 30) return d + ' days'; if (d <= 60) return d + ' days'; if (d <= 90) return d + ' days'; return d + ' days'; } },
      { key: 'bucket', label: 'Bucket', render: (v) => '<span class="badge">' + (v || '—') + '</span>' },
    ], rows);
  }

  // ── AP Aging ──
  renderAPAging(data: any): void {
    const s = data.summary || {};
    const rows = data.rows || [];
    const total = data.total_due || 0;
    this.statCard('Total Payable', this.curr(total), '💳', 'teal', rows.length + ' unpaid bills');
    this.statCard('Current', this.curr(s.current || 0), '✅', 'teal');
    this.statCard('1–30 Days', this.curr(s.days_1_30 || 0), '📅', 'blue');
    this.statCard('31–60 Days', this.curr(s.days_31_60 || 0), '⚠️', 'orange');
    this.statCard('61–90+ Days', this.curr((s.days_61_90 || 0) + (s.over_90 || 0)), '🚨', 'red');
    if (!rows.length) return;
    this.setTable('AP Aging — Total Payable: ' + this.curr(total), rows.length + ' bills', [
      { key: 'purchase_number', label: 'PO Number', render: (v) => '<code>' + (v || '—') + '</code>' },
      { key: '_vendor', label: 'Vendor', render: (_, r) => r.vendor?.name || r.vendor?.company || '—' },
      { key: 'purchase_date', label: 'Date', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
      { key: 'due_amount', label: 'Due (₹)', render: (v) => '<strong style="color:var(--warning)">' + this.curr(v) + '</strong>' },
      { key: 'days_overdue', label: 'Days Overdue', render: (v) => { const d = parseInt(v || 0); if (d <= 0) return 'Current'; if (d <= 30) return d + ' days'; if (d <= 60) return d + ' days'; if (d <= 90) return d + ' days'; return d + ' days'; } },
      { key: 'bucket', label: 'Bucket', render: (v) => '<span class="badge">' + (v || '—') + '</span>' },
    ], rows);
  }

}

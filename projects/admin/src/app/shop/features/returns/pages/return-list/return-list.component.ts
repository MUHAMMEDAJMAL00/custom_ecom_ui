import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { RequestRefundMethod, ReturnRecord, SaleForReturn, SaleItemForReturn } from '../../models/return.model';
import { ReturnsService } from '../../services/returns.service';

type Mode = 'requests' | 'log' | 'process';

interface SelectedReturnItem {
  sale_item_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  restock: number;
}

interface ReturnItemRowVm {
  saleItem: SaleItemForReturn;
  checked: boolean;
  qty: number;
  restock: number;
  unitPriceResolved: number;
}

@Component({
  selector: 'app-return-list',
  standalone: false,
  templateUrl: './return-list.component.html',
  styleUrl: './return-list.component.css',
})
export class ReturnListComponent implements OnInit {
  mode: Mode = 'requests';

  // ── Customer requests (from the website) ──
  requests: ReturnRecord[] = [];
  requestsLoading = true;
  pendingCount = 0;
  expandedRequestId: number | null = null;
  /** Request being approved / rejected in the dialog */
  acting: ReturnRecord | null = null;
  actingMode: 'approve' | 'reject' | null = null;
  approveForm = { refund_method: 'original' as RequestRefundMethod, restocking_fee: 0, restock: true, notes: '' };
  rejectReason = '';
  actingBusy = false;
  readonly refundOptions: { value: RequestRefundMethod; label: string; hint: string }[] = [
    { value: 'original', label: 'Original payment', hint: 'Refund the online (Razorpay) payment automatically' },
    { value: 'credit', label: 'Store credit', hint: 'Add to the customer\'s store credit balance' },
    { value: 'bank', label: 'Bank transfer', hint: 'You pay by bank — needs an open cash register' },
    { value: 'upi', label: 'UPI', hint: 'You pay by UPI outside the system' },
    { value: 'cash', label: 'Cash', hint: 'Cash refund — needs an open cash register' },
  ];

  // ── History (log) ──
  returns: ReturnRecord[] = [];
  loading = true;
  errorMessage = '';
  page = 1;
  limit = 20;
  totalPages = 1;
  total = 0;
  search = '';
  private searchDebounce?: ReturnType<typeof setTimeout>;

  // ── Process — Step 1 ──
  invoiceInput = '';
  isFetching = false;
  activeSale: SaleForReturn | null = null;

  // ── Process — Step 2 ──
  itemRows: ReturnItemRowVm[] = [];
  barcodeInput = '';
  scanStatus = '';
  scanStatusColor = '#9c8b91';
  private barcodeDebounce?: ReturnType<typeof setTimeout>;

  // ── Process — Step 3 ──
  restockingFee = 0;
  refundMethod = 'cash';
  notes = '';
  isSubmitting = false;

  constructor(
    private service: ReturnsService,
    private notify: NotificationService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  // ── Mode switching ──
  switchMode(mode: Mode): void {
    this.mode = mode;
    if (mode === 'requests') this.loadRequests();
    else if (mode === 'log') this.loadHistory(1);
    else setTimeout(() => document.getElementById('f-invoice-input')?.focus(), 50);
  }

  // ── History ──
  loadHistory(page?: number): void {
    this.page = page ?? this.page;
    this.loading = true;
    this.errorMessage = '';
    this.service.getAll({ page: this.page, limit: this.limit, search: this.search || undefined }).subscribe({
      next: (res) => {
        this.returns = res.data;
        this.totalPages = res.total_pages;
        this.total = res.total;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Connection failed';
        this.loading = false;
      },
    });
  }

  // ── Customer requests ──
  loadRequests(): void {
    this.requestsLoading = true;
    this.service.getAll({ page: 1, limit: 100, status: 'pending' }).subscribe({
      next: (res) => {
        this.requests = res.data;
        this.pendingCount = res.total;
        this.requestsLoading = false;
      },
      error: () => {
        this.requests = [];
        this.requestsLoading = false;
      },
    });
  }

  toggleRequest(r: ReturnRecord): void {
    this.expandedRequestId = this.expandedRequestId === r.id ? null : r.id;
    if (this.expandedRequestId && !r.items?.some((i) => i.product_name)) {
      this.service.getById(r.id).subscribe({ next: (full) => (r.items = full.items), error: () => {} });
    }
  }

  openApprove(r: ReturnRecord): void {
    this.acting = r;
    this.actingMode = 'approve';
    // Prepaid orders default to refunding the original payment, COD to store credit
    this.approveForm = { refund_method: r.refund_method === 'original' ? 'original' : 'credit', restocking_fee: 0, restock: true, notes: '' };
  }

  openReject(r: ReturnRecord): void {
    this.acting = r;
    this.actingMode = 'reject';
    this.rejectReason = '';
  }

  closeAction(): void {
    if (this.actingBusy) return;
    this.acting = null;
    this.actingMode = null;
  }

  get approveRefund(): number {
    if (!this.acting) return 0;
    return Math.max(0, parseFloat(String(this.acting.total_amount || 0)) - (Number(this.approveForm.restocking_fee) || 0));
  }

  confirmApprove(): void {
    if (!this.acting || this.actingBusy) return;
    this.actingBusy = true;
    this.service.approve(this.acting.id, {
      refund_method: this.approveForm.refund_method,
      restocking_fee: Number(this.approveForm.restocking_fee) || 0,
      restock: this.approveForm.restock,
      notes: this.approveForm.notes.trim() || undefined,
    }).subscribe({
      next: (res) => {
        this.actingBusy = false;
        const amount = this.formatCurrency(res.refund.amount);
        if (res.refund.status === 'refunded') this.notify.success(`Approved — ${amount} refunded to the customer's payment (Razorpay ${res.refund.reference})`);
        else if (res.refund.status === 'manual' || res.refund.status === 'failed') this.notify.warning(`Approved. ${res.refund.message} (${amount})`);
        else this.notify.success(`Approved — ${amount} refunded by ${res.refund.method}`);
        this.closeAction();
        this.loadRequests();
      },
      error: (err) => {
        this.actingBusy = false;
        this.notify.error(err.error?.message || 'Could not approve the return');
      },
    });
  }

  confirmReject(): void {
    if (!this.acting || this.actingBusy) return;
    if (this.rejectReason.trim().length < 3) {
      this.notify.warning('Tell the customer why (at least a few words)');
      return;
    }
    this.actingBusy = true;
    this.service.reject(this.acting.id, this.rejectReason.trim()).subscribe({
      next: () => {
        this.actingBusy = false;
        this.notify.success('Return request rejected');
        this.closeAction();
        this.loadRequests();
      },
      error: (err) => {
        this.actingBusy = false;
        this.notify.error(err.error?.message || 'Could not reject the request');
      },
    });
  }

  statusClass(status: string): string {
    return { completed: 'st-done', approved: 'st-done', pending: 'st-pending', rejected: 'st-rejected' }[status] || '';
  }

  onSearchInput(value: string): void {
    this.search = value;
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => this.loadHistory(1), 250);
  }

  netRefund(r: ReturnRecord): number {
    return parseFloat(String(r.total_amount || 0)) - parseFloat(String(r.restocking_fee || 0));
  }

  formatCurrency(n: number | string): string {
    return '₹' + parseFloat(String(n || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(s: string): string {
    if (!s) return '—';
    const d = new Date(s);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  // ── Step 1: fetch sale ──
  fetchSale(): void {
    if (this.isFetching) return;
    const inv = this.invoiceInput.trim();
    if (!inv) {
      this.notify.warning('Enter an invoice number');
      return;
    }
    this.isFetching = true;
    this.service.getSaleByInvoice(inv).subscribe({
      next: (sale) => {
        this.isFetching = false;
        this.activeSale = sale;
        this.itemRows = (sale.items || []).map((si) => ({
          saleItem: si,
          checked: false,
          qty: 1,
          restock: 1,
          unitPriceResolved: this.resolveUnitPrice(si),
        }));
        setTimeout(() => document.getElementById('f-item-barcode')?.focus(), 100);
      },
      error: (err) => {
        this.isFetching = false;
        this.notify.error(err.error?.message || 'Could not find sale');
        this.resetProcessForm();
      },
    });
  }

  private resolveUnitPrice(si: SaleItemForReturn): number {
    const qty = parseFloat(String(si.quantity || 0));
    const total = parseFloat(String(si.total_price || 0));
    return qty > 0 && total > 0 ? total / qty : parseFloat(String(si.unit_price || 0));
  }

  resetProcessForm(): void {
    this.activeSale = null;
    this.itemRows = [];
    this.invoiceInput = '';
    this.restockingFee = 0;
    this.refundMethod = 'cash';
    this.notes = '';
    this.scanStatus = '';
  }

  // ── Step 2: item selection ──
  toggleItem(row: ReturnItemRowVm): void {
    row.checked = !row.checked;
  }

  // ── Barcode scan ──
  onBarcodeInput(value: string): void {
    this.barcodeInput = value;
    clearTimeout(this.barcodeDebounce);
    const trimmed = value.trim();
    if (!trimmed) return;
    this.barcodeDebounce = setTimeout(() => {
      if (trimmed.length >= 4 && !/\s/.test(trimmed)) this.handleBarcodeScan(trimmed);
    }, 300);
  }

  onBarcodeEnter(): void {
    clearTimeout(this.barcodeDebounce);
    this.handleBarcodeScan(this.barcodeInput.trim());
  }

  private handleBarcodeScan(barcode: string): void {
    if (!barcode || !this.activeSale) return;
    this.scanStatus = 'Searching…';
    this.scanStatusColor = '#6366f1';
    this.service.scanBarcode(barcode).subscribe({
      next: (product) => {
        this.barcodeInput = '';
        if (!product?.id) {
          this.scanStatus = 'Not found';
          this.scanStatusColor = '#ef4444';
          return;
        }
        const row = this.itemRows.find((r) => r.saleItem.product_id === product.id);
        if (!row) {
          this.scanStatus = 'Not in sale';
          this.scanStatusColor = '#f59e0b';
          this.notify.warning(product.name + ' is not in this sale');
          return;
        }
        row.checked = true;
        this.scanStatus = '✓ Selected';
        this.scanStatusColor = '#10b981';
        this.notify.success('Selected: ' + product.name);
        setTimeout(() => document.getElementById('f-item-barcode')?.focus(), 80);
      },
      error: () => {
        this.barcodeInput = '';
        this.scanStatus = 'Not found';
        this.scanStatusColor = '#ef4444';
        this.notify.warning('No product matched barcode: ' + barcode);
      },
    });
  }

  // ── Step 3: refund calc ──
  get refundSubtotal(): number {
    return this.itemRows
      .filter((r) => r.checked)
      .reduce((sum, r) => sum + r.qty * r.unitPriceResolved, 0);
  }

  get refundNet(): number {
    const net = this.refundSubtotal - (this.restockingFee || 0);
    return isNaN(net) || net < 0 ? 0 : net;
  }

  // ── Submit ──
  submitReturn(): void {
    if (this.isSubmitting || !this.activeSale) return;
    const selected: SelectedReturnItem[] = this.itemRows
      .filter((r) => r.checked)
      .map((r) => ({
        sale_item_id: r.saleItem.id,
        product_id: r.saleItem.product_id,
        product_name: r.saleItem.product_name,
        quantity: r.qty,
        unit_price: r.unitPriceResolved,
        restock: r.restock,
      }));

    if (!selected.length) {
      this.notify.warning('Select at least one item');
      return;
    }

    const storeId = this.authService.activeStoreId;
    if (!storeId) {
      this.notify.error('No active store selected');
      return;
    }

    this.isSubmitting = true;
    this.service
      .create({
        sale_id: this.activeSale.id,
        store_id: storeId,
        items: selected,
        restocking_fee: this.restockingFee || 0,
        refund_method: this.refundMethod,
        notes: this.notes.trim(),
        return_reason: this.notes.trim(),
      })
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.notify.success('Return processed successfully');
          this.resetProcessForm();
          this.switchMode('log');
        },
        error: (err) => {
          this.isSubmitting = false;
          this.notify.error(err.error?.message || 'Processing failed');
        },
      });
  }
}

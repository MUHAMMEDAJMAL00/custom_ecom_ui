import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Vendor } from '../../../vendors/models/vendor.model';
import { VendorsService } from '../../../vendors/services/vendors.service';
import { DuePurchase, SupplierLedgerEntry, SupplierPaymentRecord } from '../../models/supplier-payment.model';
import { SupplierPaymentsService } from '../../services/supplier-payments.service';

type TabId = 'due' | 'history' | 'ledger';

@Component({
  selector: 'app-supplier-payment-list',
  standalone: false,
  templateUrl: './supplier-payment-list.component.html',
  styleUrl: './supplier-payment-list.component.css',
})
export class SupplierPaymentListComponent implements OnInit {
  activeTab: TabId = 'due';
  ledgerTabVisible = false;

  vendorsWithBalance: Vendor[] = [];
  loadingDue = false;

  history: SupplierPaymentRecord[] = [];
  loadingHistory = false;

  activeVendorId: number | null = null;
  ledgerVendorName = '—';
  ledgerVendorPhone = 'No Phone';
  ledgerBalance = 0;
  ledgerEntries: SupplierLedgerEntry[] = [];
  loadingLedger = false;

  duePurchases: DuePurchase[] = [];
  loadingInvoices = false;

  paymentMode: 'advance' | 'invoice' = 'advance';
  saving = false;

  readonly methodOptions = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank', label: 'Bank Transfer' },
    { value: 'upi', label: 'UPI / GPay' },
    { value: 'card', label: 'Card' },
    { value: 'cheque', label: 'Cheque' },
  ];

  form: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private paymentsService: SupplierPaymentsService,
    private vendorsService: VendorsService,
    private notify: NotificationService,
    private confirmService: ConfirmService,
  ) {
    this.form = this.fb.group({
      invoice: [''],
      amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
      method: ['cash'],
      reference: [''],
      notes: [''],
    });
  }

  ngOnInit(): void {
    this.loadVendorBalances();
  }

  switchTab(tab: TabId): void {
    this.activeTab = tab;
    if (tab === 'due') this.loadVendorBalances();
    if (tab === 'history') this.loadPaymentHistory();
  }

  refresh(): void {
    if (this.activeTab === 'due') this.loadVendorBalances();
    else if (this.activeTab === 'history') this.loadPaymentHistory();
    else if (this.activeVendorId) this.openLedger(this.activeVendorId);
  }

  loadVendorBalances(): void {
    this.loadingDue = true;
    this.vendorsService.getAll({ limit: 1000 }).subscribe({
      next: (res) => {
        this.vendorsWithBalance = (res.data || []).filter((v) => parseFloat(String(v.balance)) !== 0);
        this.loadingDue = false;
      },
      error: () => {
        this.loadingDue = false;
        this.notify.error('Failed to load balances');
      },
    });
  }

  loadPaymentHistory(): void {
    this.loadingHistory = true;
    this.paymentsService.getAll().subscribe({
      next: (rows) => {
        this.history = rows;
        this.loadingHistory = false;
      },
      error: () => {
        this.loadingHistory = false;
        this.notify.error('Error loading history');
      },
    });
  }

  balanceClass(v: Vendor): string {
    return parseFloat(String(v.balance)) > 0 ? 'text-danger' : 'text-success';
  }

  openLedger(vendorId: number): void {
    this.activeVendorId = vendorId;
    this.ledgerTabVisible = true;
    this.activeTab = 'ledger';
    this.loadingLedger = true;

    this.paymentsService.getLedger(vendorId).subscribe({
      next: (res) => {
        this.ledgerVendorName = res.vendor?.name || '—';
        this.ledgerVendorPhone = res.vendor?.phone || 'No Phone';
        this.ledgerBalance = parseFloat(String(res.vendor?.current_balance ?? 0));
        this.ledgerEntries = res.ledger || [];
        this.loadingLedger = false;
      },
      error: () => {
        this.loadingLedger = false;
        this.notify.error('Failed to load ledger data');
      },
    });

    this.loadDuePurchases(vendorId);
  }

  loadDuePurchases(vendorId: number): void {
    this.loadingInvoices = true;
    this.paymentsService.getDuePurchases(vendorId).subscribe({
      next: (rows) => {
        this.duePurchases = rows;
        this.loadingInvoices = false;
      },
      error: () => {
        this.duePurchases = [];
        this.loadingInvoices = false;
      },
    });
  }

  entryDebit(item: SupplierLedgerEntry): number {
    return item.is_debt ? item.amount : 0;
  }

  entryCredit(item: SupplierLedgerEntry): number {
    return !item.is_debt ? item.amount : 0;
  }

  setPaymentMode(mode: 'advance' | 'invoice'): void {
    this.paymentMode = mode;
    if (mode === 'invoice') this.autoFillFromInvoice();
  }

  onInvoiceChange(): void {
    if (this.paymentMode === 'invoice') this.autoFillFromInvoice();
  }

  private autoFillFromInvoice(): void {
    const invoiceId = Number(this.form.value.invoice);
    const purchase = this.duePurchases.find((p) => p.id === invoiceId);
    if (purchase) this.form.patchValue({ amount: parseFloat(String(purchase.due_amount)) });
  }

  formatDate(raw: string): string {
    if (!raw) return '—';
    const parsed = new Date(raw);
    if (isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  async submitPayment(): Promise<void> {
    if (!this.activeVendorId) return;
    const raw = this.form.getRawValue();
    const amount = parseFloat(raw.amount);
    const ref = (raw.reference || '').trim();
    const purchaseId = this.paymentMode === 'invoice' ? parseInt(raw.invoice, 10) || null : null;

    if (!amount || isNaN(amount) || amount <= 0) {
      this.notify.warning('Please enter a valid amount');
      return;
    }
    if (!purchaseId && !ref) {
      this.notify.warning('Please enter a Reference ID for Direct Payment');
      return;
    }

    const invoiceOption = purchaseId ? this.duePurchases.find((p) => p.id === purchaseId) : null;
    const invoiceLabel = invoiceOption ? `${invoiceOption.purchase_number} (Due: ₹${invoiceOption.due_amount})` : 'Direct Payment';
    const methodLabel = raw.method.charAt(0).toUpperCase() + raw.method.slice(1);

    const confirmed = await this.confirmService.show({
      title: 'Confirm Payment',
      message: `Pay ₹${amount.toFixed(2)} to ${this.ledgerVendorName}?`,
      note: invoiceLabel + ' via ' + methodLabel + (ref ? ' | Ref: ' + ref : ''),
      confirmLabel: `Pay ₹${amount.toFixed(2)}`,
    });
    if (!confirmed) return;

    this.saving = true;
    this.paymentsService
      .create({
        vendor_id: this.activeVendorId,
        purchase_id: purchaseId,
        amount,
        payment_method: raw.method,
        reference_number: ref,
        notes: (raw.notes || '').trim(),
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.notify.success('Payment recorded successfully');
          this.form.reset({ invoice: '', amount: null, method: 'cash', reference: '', notes: '' });
          this.setPaymentMode('advance');
          this.openLedger(this.activeVendorId!);
        },
        error: (err) => {
          this.saving = false;
          this.notify.error(err.error?.message || 'Failed to record payment');
        },
      });
  }
}

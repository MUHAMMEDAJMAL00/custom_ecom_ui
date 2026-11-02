import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { NotificationService } from '../../../../core/services/notification.service';
import { CustomerLedgerEntry, CustomerPaymentRecord, DueCustomer, DueSale } from '../../models/customer-payment.model';
import { CustomerPaymentsService } from '../../services/customer-payments.service';

type TabId = 'due' | 'history' | 'ledger';

@Component({
  selector: 'app-customer-payment-list',
  standalone: false,
  templateUrl: './customer-payment-list.component.html',
  styleUrl: './customer-payment-list.component.css',
})
export class CustomerPaymentListComponent implements OnInit {
  activeTab: TabId = 'due';
  ledgerTabVisible = false;

  dueCustomers: DueCustomer[] = [];
  loadingDue = false;

  history: CustomerPaymentRecord[] = [];
  loadingHistory = false;

  activeCustomerId: number | null = null;
  ledgerCustomerName = '—';
  ledgerCustomerPhone = 'No Phone';
  ledgerBalance = 0;
  ledgerEntries: CustomerLedgerEntry[] = [];
  loadingLedger = false;

  dueSales: DueSale[] = [];
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
    private paymentsService: CustomerPaymentsService,
    private notify: NotificationService,
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
    this.loadDueCustomers();
  }

  switchTab(tab: TabId): void {
    this.activeTab = tab;
    if (tab === 'due') this.loadDueCustomers();
    if (tab === 'history') this.loadPaymentHistory();
  }

  refresh(): void {
    if (this.activeTab === 'due') this.loadDueCustomers();
    else if (this.activeTab === 'history') this.loadPaymentHistory();
    else if (this.activeCustomerId) this.openLedger(this.activeCustomerId);
  }

  loadDueCustomers(): void {
    this.loadingDue = true;
    this.paymentsService.getDueCustomers().subscribe({
      next: (rows) => {
        this.dueCustomers = rows;
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

  openLedger(customerId: number): void {
    this.activeCustomerId = customerId;
    this.ledgerTabVisible = true;
    this.activeTab = 'ledger';
    this.loadingLedger = true;

    this.paymentsService.getLedger(customerId).subscribe({
      next: (res) => {
        this.ledgerCustomerName = res.customer?.name || '—';
        this.ledgerCustomerPhone = res.customer?.phone || 'No Phone';
        this.ledgerBalance = parseFloat(String(res.customer?.balance ?? 0));
        this.ledgerEntries = res.ledger || [];
        this.loadingLedger = false;
      },
      error: () => {
        this.loadingLedger = false;
        this.notify.error('Failed to load ledger data');
      },
    });

    this.loadDueInvoices(customerId);
  }

  loadDueInvoices(customerId: number): void {
    this.loadingInvoices = true;
    this.paymentsService.getDueSales(customerId).subscribe({
      next: (rows) => {
        this.dueSales = rows;
        this.loadingInvoices = false;
      },
      error: () => {
        this.dueSales = [];
        this.loadingInvoices = false;
      },
    });
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
    const sale = this.dueSales.find((s) => s.id === invoiceId);
    if (sale) this.form.patchValue({ amount: parseFloat(String(sale.due_amount)) });
  }

  formatDate(raw: string): string {
    if (!raw) return '—';
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const [y, m, d] = raw.split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    const parsed = new Date(raw);
    if (isNaN(parsed.getTime())) return '—';
    return (
      parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' ' +
      parsed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    );
  }

  submitPayment(): void {
    if (!this.activeCustomerId) return;
    const raw = this.form.getRawValue();
    const amount = parseFloat(raw.amount);

    if (!amount || isNaN(amount) || amount <= 0) {
      this.notify.warning('Please enter a valid amount');
      return;
    }

    const saleId = this.paymentMode === 'invoice' ? parseInt(raw.invoice, 10) || null : null;

    this.saving = true;
    this.paymentsService
      .create({
        customer_id: this.activeCustomerId,
        sale_id: saleId,
        amount,
        payment_method: raw.method,
        reference_number: (raw.reference || '').trim(),
        notes: (raw.notes || '').trim(),
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.notify.success('Payment recorded successfully');
          this.form.reset({ invoice: '', amount: null, method: 'cash', reference: '', notes: '' });
          this.setPaymentMode('advance');
          this.openLedger(this.activeCustomerId!);
        },
        error: (err) => {
          this.saving = false;
          this.notify.error(err.error?.message || 'Failed to record payment');
        },
      });
  }
}

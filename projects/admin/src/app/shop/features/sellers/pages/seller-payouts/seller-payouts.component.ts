import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { PayoutStatus, SellerPayout } from '../../models/seller.model';
import { SellersService } from '../../services/sellers.service';

@Component({
  selector: 'app-seller-payouts',
  standalone: false,
  templateUrl: './seller-payouts.component.html',
  styleUrl: './seller-payouts.component.css',
})
export class SellerPayoutsComponent implements OnInit {
  payouts: SellerPayout[] = [];
  loading = true;
  errorMessage = '';
  page = 1;
  limit = 20;
  totalPages = 1;
  statusFilter = '';

  payModalOpen = false;
  selectedPayout: SellerPayout | null = null;
  saving = false;

  payForm: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private sellersService: SellersService,
    private notify: NotificationService,
    private confirmService: ConfirmService,
  ) {
    this.payForm = this.fb.group({
      payment_method: ['bank_transfer', Validators.required],
      payment_reference: [''],
      notes: [''],
    });
  }

  ngOnInit(): void {
    this.load(1);
  }

  load(page?: number): void {
    this.page = page ?? this.page;
    this.loading = true;
    this.errorMessage = '';
    this.sellersService
      .getPayouts({ page: this.page, limit: this.limit, status: this.statusFilter || undefined })
      .subscribe({
        next: (res) => {
          this.payouts = res.data;
          this.totalPages = res.total_pages || 1;
          this.loading = false;
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to load payouts.';
          this.loading = false;
        },
      });
  }

  onFilterChange(): void {
    this.load(1);
  }

  onLimitChange(value: string): void {
    this.limit = parseInt(value, 10);
    this.load(1);
  }

  formatCurrency(value: number | string | null | undefined): string {
    return parseFloat(String(value ?? 0)).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  statusClass(status: PayoutStatus): string {
    const classes: Record<PayoutStatus, string> = {
      pending: 'badge-pending',
      paid: 'badge-active',
      cancelled: 'badge-cancelled',
    };
    return classes[status] || 'badge-inactive';
  }

  methodLabel(method: string | null): string {
    const labels: Record<string, string> = {
      bank_transfer: 'Bank Transfer',
      upi: 'UPI',
      cheque: 'Cheque',
      cash: 'Cash',
    };
    return method ? labels[method] || method : '—';
  }

  openMarkPaid(payout: SellerPayout): void {
    this.selectedPayout = payout;
    this.payForm.reset({ payment_method: 'bank_transfer', payment_reference: '', notes: '' });
    this.payModalOpen = true;
    this.sellersService.getPayout(payout.id).subscribe({
      next: (detail) => {
        if (this.selectedPayout?.id === payout.id) this.selectedPayout = detail;
      },
      error: () => undefined,
    });
  }

  closePayModal(): void {
    this.payModalOpen = false;
    this.selectedPayout = null;
  }

  submitPayment(): void {
    if (!this.selectedPayout) return;
    if (this.payForm.invalid) {
      this.notify.warning('Select a payment method');
      return;
    }
    const raw = this.payForm.getRawValue();
    this.saving = true;
    this.sellersService
      .markPayoutPaid(this.selectedPayout.id, {
        payment_method: raw.payment_method,
        payment_reference: raw.payment_reference?.trim() || null,
        notes: raw.notes?.trim() || null,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.notify.success('Payout marked as paid');
          this.closePayModal();
          this.load(this.page);
        },
        error: (err) => {
          this.saving = false;
          this.notify.error(err.error?.message || 'Could not update payout');
        },
      });
  }

  async cancelPayout(payout: SellerPayout): Promise<void> {
    const confirmed = await this.confirmService.show({
      title: 'Cancel Payout',
      message: `Cancel payout ${payout.payout_number}?`,
      note: 'The sale lines will be released for a future payout.',
      confirmLabel: 'Cancel Payout',
    });
    if (!confirmed) return;

    this.sellersService.cancelPayout(payout.id).subscribe({
      next: () => {
        this.notify.success('Payout cancelled');
        this.load(this.page);
      },
      error: (err) => this.notify.error(err.error?.message || 'Could not cancel payout'),
    });
  }
}

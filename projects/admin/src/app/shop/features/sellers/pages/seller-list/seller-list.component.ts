import { shopUrl } from '../../../../core/utils/shop-url';
import { localDate } from '../../../../core/utils/date.util';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Seller, SellerPayoutPreview, SellerStatus } from '../../models/seller.model';
import { SellersService } from '../../services/sellers.service';

type DrawerMode = 'view' | 'edit' | null;
type ReasonAction = 'reject' | 'suspend';

@Component({
  selector: 'app-seller-list',
  standalone: false,
  templateUrl: './seller-list.component.html',
  styleUrl: './seller-list.component.css',
})
export class SellerListComponent implements OnInit {
  sellers: Seller[] = [];
  loading = true;
  errorMessage = '';

  page = 1;
  limit = 20;
  totalPages = 1;
  search = '';
  statusFilter = '';
  private searchDebounce?: ReturnType<typeof setTimeout>;

  drawerMode: DrawerMode = null;
  selected: Seller | null = null;
  detailLoading = false;
  saving = false;

  reasonAction: ReasonAction | null = null;
  reasonText = '';
  reasonSaving = false;

  preview: SellerPayoutPreview | null = null;
  previewLoading = false;
  previewDate = localDate(new Date());
  payoutSaving = false;
  readonly today = localDate(new Date());

  editForm: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private sellersService: SellersService,
    private notify: NotificationService,
    private confirmService: ConfirmService,
    private router: Router,
  ) {
    this.editForm = this.fb.group({
      commission_rate: [null as number | null, [Validators.min(0), Validators.max(100)]],
    });
  }

  // ── Commission settings ──
  defaultRate: number | null = null;
  defaultRateInput = '';
  savingRate = false;
  showCommissionHelp = false;
  /** Example order for the calculator: each line is one seller's product */
  calcLines = [
    { name: 'Lipstick (Seller A, own rate 12%)', price: 499, qty: 2, rate: 12 as number | null },
    { name: 'Face serum (Seller B, default rate)', price: 899, qty: 1, rate: null as number | null },
  ];

  ngOnInit(): void {
    this.load(1);
    this.sellersService.getDefaultCommission().subscribe({
      next: (rate) => {
        this.defaultRate = rate;
        this.defaultRateInput = String(rate);
      },
      error: () => {},
    });
  }

  saveDefaultRate(): void {
    const rate = parseFloat(this.defaultRateInput);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      this.notify.warning('Enter a commission between 0 and 100%');
      return;
    }
    this.savingRate = true;
    this.sellersService.setDefaultCommission(rate).subscribe({
      next: (saved) => {
        this.savingRate = false;
        this.defaultRate = saved;
        this.defaultRateInput = String(saved);
        this.notify.success(`Default commission is now ${saved}% — applies to new orders`);
        this.load();
      },
      error: (err) => {
        this.savingRate = false;
        this.notify.error(err.error?.message || 'Could not save');
      },
    });
  }

  /** Calculator: line total, rate used, commission and seller earning per line. */
  calcRow(line: { price: number; qty: number; rate: number | null }) {
    const total = (Number(line.price) || 0) * (Number(line.qty) || 0);
    const rate = line.rate ?? this.defaultRate ?? 0;
    const commission = Math.round(total * rate) / 100;
    return { total, rate, commission, earning: total - commission };
  }

  get calcTotals() {
    return this.calcLines.reduce(
      (acc, l) => {
        const r = this.calcRow(l);
        return { total: acc.total + r.total, commission: acc.commission + r.commission, earning: acc.earning + r.earning };
      },
      { total: 0, commission: 0, earning: 0 },
    );
  }

  load(page?: number): void {
    this.page = page ?? this.page;
    this.loading = true;
    this.errorMessage = '';
    this.sellersService
      .getAll({
        page: this.page,
        limit: this.limit,
        search: this.search || undefined,
        status: this.statusFilter || undefined,
      })
      .subscribe({
        next: (res) => {
          this.sellers = res.data;
          this.totalPages = res.total_pages || 1;
          this.loading = false;
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to load sellers.';
          this.loading = false;
        },
      });
  }

  onSearchInput(value: string): void {
    this.search = value;
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => this.load(1), 250);
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

  commissionLabel(seller: Seller): string {
    if (seller.commission_rate !== null && seller.commission_rate !== undefined && seller.commission_rate !== '') {
      return `${parseFloat(String(seller.commission_rate)).toFixed(2)}% (own)`;
    }
    return this.defaultRate !== null ? `${this.defaultRate}% (default)` : 'Default';
  }

  statusClass(status: SellerStatus): string {
    const classes: Record<SellerStatus, string> = {
      pending: 'badge-pending',
      approved: 'badge-active',
      rejected: 'badge-cancelled',
      suspended: 'badge-warning',
    };
    return classes[status] || 'badge-inactive';
  }

  get drawerTitle(): string {
    if (this.drawerMode === 'edit') return 'Edit Seller';
    return this.selected?.business_name || 'Seller Details';
  }

  openView(seller: Seller): void {
    this.selected = seller;
    this.drawerMode = 'view';
    this.preview = null;
    this.loadDetail(seller.id);
  }

  openEdit(seller: Seller): void {
    this.detailLoading = true;
    this.sellersService.getById(seller.id).subscribe({
      next: (detail) => {
        this.selected = detail;
        this.editForm.reset({
          commission_rate: detail.commission_rate == null ? null : Number(detail.commission_rate),
        });
        this.drawerMode = 'edit';
        this.detailLoading = false;
      },
      error: (err) => {
        this.detailLoading = false;
        this.notify.error(err.error?.message || 'Could not load seller');
      },
    });
  }

  private loadDetail(id: number): void {
    this.detailLoading = true;
    this.sellersService.getById(id).subscribe({
      next: (detail) => {
        if (this.selected?.id === id) this.selected = detail;
        this.detailLoading = false;
      },
      error: (err) => {
        this.detailLoading = false;
        this.notify.error(err.error?.message || 'Could not load seller');
      },
    });
  }

  closeDrawer(): void {
    this.drawerMode = null;
    this.selected = null;
    this.preview = null;
    this.editForm.reset({ commission_rate: null });
  }

  saveEdit(): void {
    if (!this.selected) return;
    const rate = this.editForm.value.commission_rate;
    if (rate !== null && rate !== undefined && (rate < 0 || rate > 100)) {
      this.notify.warning('Commission must be between 0 and 100');
      return;
    }
    this.saving = true;
    this.sellersService.update(this.selected.id, { commission_rate: rate ?? null }).subscribe({
      next: (detail) => {
        this.saving = false;
        this.selected = detail;
        this.notify.success('Seller updated');
        this.closeDrawer();
        this.load(this.page);
      },
      error: (err) => {
        this.saving = false;
        this.notify.error(err.error?.message || 'Save failed');
      },
    });
  }

  async approve(seller: Seller): Promise<void> {
    const confirmed = await this.confirmService.show({
      title: 'Approve Seller',
      message: `Approve "${seller.business_name}"?`,
      note: 'The seller will be able to sign in and list products.',
      confirmLabel: 'Approve',
    });
    if (!confirmed) return;

    this.sellersService.approve(seller.id).subscribe({
      next: () => {
        this.notify.success('Seller approved');
        this.afterAction(seller.id);
      },
      error: (err) => this.notify.error(err.error?.message || 'Approval failed'),
    });
  }

  startReason(action: ReasonAction, seller: Seller): void {
    this.selected = seller;
    this.reasonAction = action;
    this.reasonText = '';
  }

  closeReason(): void {
    this.reasonAction = null;
    this.reasonText = '';
  }

  submitReason(): void {
    if (!this.selected || !this.reasonAction) return;
    const reason = this.reasonText.trim();
    if (this.reasonAction === 'reject' && reason.length < 3) {
      this.notify.warning('Enter a rejection reason (at least 3 characters)');
      return;
    }
    const id = this.selected.id;
    const action = this.reasonAction;
    this.reasonSaving = true;
    const request$ = action === 'reject' ? this.sellersService.reject(id, reason) : this.sellersService.suspend(id, reason);
    request$.subscribe({
      next: () => {
        this.reasonSaving = false;
        this.notify.success(action === 'reject' ? 'Seller rejected' : 'Seller suspended');
        this.closeReason();
        this.afterAction(id);
      },
      error: (err) => {
        this.reasonSaving = false;
        this.notify.error(err.error?.message || 'Action failed');
      },
    });
  }

  async reactivate(seller: Seller): Promise<void> {
    const confirmed = await this.confirmService.show({
      title: 'Reactivate Seller',
      message: `Reactivate "${seller.business_name}"?`,
      note: 'The seller will regain access to the portal.',
      confirmLabel: 'Reactivate',
    });
    if (!confirmed) return;

    this.sellersService.reactivate(seller.id).subscribe({
      next: () => {
        this.notify.success('Seller reactivated');
        this.afterAction(seller.id);
      },
      error: (err) => this.notify.error(err.error?.message || 'Reactivation failed'),
    });
  }

  private afterAction(id: number): void {
    this.load(this.page);
    if (this.drawerMode === 'view' && this.selected?.id === id) this.loadDetail(id);
  }

  previewPayout(): void {
    if (!this.selected) return;
    this.previewLoading = true;
    this.preview = null;
    this.sellersService.previewPayout(this.selected.id, this.previewDate).subscribe({
      next: (preview) => {
        this.preview = preview;
        this.previewLoading = false;
      },
      error: (err) => {
        this.previewLoading = false;
        this.notify.error(err.error?.message || 'Could not calculate payout');
      },
    });
  }

  async createPayout(): Promise<void> {
    if (!this.selected || !this.preview) return;
    if (!this.preview.line_count) {
      this.notify.warning('Nothing to pay out for this period');
      return;
    }
    const confirmed = await this.confirmService.show({
      title: 'Create Payout',
      message: `Create a payout of ₹${this.formatCurrency(this.preview.net_payable)}?`,
      note: `${this.preview.line_count} sale line(s) up to ${this.preview.period_to}.`,
      confirmLabel: 'Create Payout',
    });
    if (!confirmed) return;

    this.payoutSaving = true;
    this.sellersService.createPayout(this.selected.id, { period_to: this.preview.period_to }).subscribe({
      next: (payout) => {
        this.payoutSaving = false;
        this.notify.success(`Payout ${payout.payout_number} created`);
        this.closeDrawer();
        this.router.navigate([shopUrl('/sellers/payouts')]);
      },
      error: (err) => {
        this.payoutSaving = false;
        this.notify.error(err.error?.message || 'Could not create payout');
      },
    });
  }
}

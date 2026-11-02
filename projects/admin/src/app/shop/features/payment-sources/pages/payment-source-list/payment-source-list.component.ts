import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { PaymentSource, PaymentSourceType } from '../../models/payment-source.model';
import { PaymentSourcesService } from '../../services/payment-sources.service';

const TYPE_LABELS: Record<PaymentSourceType, string> = { cash: 'Cash', upi: 'UPI', card: 'Card', bank: 'Bank Transfer', other: 'Other' };
const DEFAULT_ICONS: Record<PaymentSourceType, string> = {
  cash: 'bi-cash-coin',
  upi: 'bi-qr-code-scan',
  card: 'bi-credit-card-2-front',
  bank: 'bi-bank2',
  other: 'bi-three-dots',
};
const ICON_OPTIONS: Array<{ cls: string; label: string }> = [
  { cls: 'bi-cash-coin', label: 'Cash' },
  { cls: 'bi-cash-stack', label: 'Cash Stack' },
  { cls: 'bi-credit-card-2-front', label: 'Card' },
  { cls: 'bi-credit-card', label: 'Card 2' },
  { cls: 'bi-qr-code-scan', label: 'QR Scan' },
  { cls: 'bi-qr-code', label: 'QR Code' },
  { cls: 'bi-bank2', label: 'Bank' },
  { cls: 'bi-building', label: 'Building' },
  { cls: 'bi-phone', label: 'Phone Pay' },
  { cls: 'bi-phone-flip', label: 'Mobile' },
  { cls: 'bi-wallet2', label: 'Wallet' },
  { cls: 'bi-wallet-fill', label: 'Wallet Fill' },
  { cls: 'bi-currency-rupee', label: 'Rupee' },
  { cls: 'bi-currency-dollar', label: 'Dollar' },
  { cls: 'bi-upc-scan', label: 'Barcode' },
  { cls: 'bi-receipt', label: 'Receipt' },
  { cls: 'bi-shield-check', label: 'Secure' },
  { cls: 'bi-globe', label: 'Online' },
  { cls: 'bi-arrows-split', label: 'Split' },
  { cls: 'bi-three-dots', label: 'Other' },
];

@Component({
  selector: 'app-payment-source-list',
  standalone: false,
  templateUrl: './payment-source-list.component.html',
  styleUrl: './payment-source-list.component.css',
})
export class PaymentSourceListComponent implements OnInit {
  sources: PaymentSource[] = [];
  loading = true;
  errorMessage = '';

  readonly iconOptions = ICON_OPTIONS;
  readonly typeOptions: PaymentSourceType[] = ['cash', 'upi', 'card', 'bank', 'other'];

  modalOpen = false;
  editId: number | null = null;
  saving = false;
  selectedIcon = DEFAULT_ICONS.cash;

  form: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private paymentSourcesService: PaymentSourcesService,
    private notify: NotificationService,
    private confirmService: ConfirmService,
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      type: ['cash' as PaymentSourceType, Validators.required],
      display_order: [0],
      notes: [''],
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.paymentSourcesService.getAll().subscribe({
      next: (rows) => {
        this.sources = rows;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load. Please refresh.';
        this.loading = false;
      },
    });
  }

  typeLabel(type: PaymentSourceType): string {
    return TYPE_LABELS[type] || type;
  }

  cardIcon(s: PaymentSource): string {
    return s.icon || DEFAULT_ICONS[s.type] || 'bi-three-dots';
  }

  // ── Type change auto-suggests icon (unless user already picked a custom one) ──
  onTypeChange(): void {
    const type = this.form.value.type as PaymentSourceType;
    const suggested = DEFAULT_ICONS[type] || 'bi-three-dots';
    const isDefaultForSomeType = Object.values(DEFAULT_ICONS).includes(this.selectedIcon);
    if (!this.selectedIcon || isDefaultForSomeType) {
      this.selectedIcon = suggested;
    }
  }

  pickIcon(icon: string): void {
    this.selectedIcon = icon;
  }

  // ── Add / Edit ─────────────────────────────────────────────
  openAdd(): void {
    this.editId = null;
    this.form.reset({ name: '', type: 'cash', display_order: 0, notes: '' });
    this.selectedIcon = DEFAULT_ICONS.cash;
    this.modalOpen = true;
  }

  openEdit(source: PaymentSource): void {
    this.editId = source.id;
    this.form.reset({
      name: source.name,
      type: source.type,
      display_order: source.display_order || 0,
      notes: source.notes || '',
    });
    this.selectedIcon = source.icon || DEFAULT_ICONS[source.type] || 'bi-three-dots';
    this.modalOpen = true;
  }

  get modalTitle(): string {
    return this.editId ? 'Edit Payment Method' : 'Add Payment Method';
  }

  handleSave(): void {
    const raw = this.form.getRawValue();
    const name = (raw.name || '').trim();
    if (!name) {
      this.notify.error('Name is required');
      return;
    }

    const payload: Partial<PaymentSource> = {
      name,
      type: raw.type,
      icon: this.selectedIcon || DEFAULT_ICONS[raw.type as PaymentSourceType] || 'bi-three-dots',
      display_order: parseInt(raw.display_order, 10) || 0,
      notes: raw.notes?.trim() || null,
    };

    this.saving = true;
    const request$ = this.editId ? this.paymentSourcesService.update(this.editId, payload) : this.paymentSourcesService.create(payload);
    request$.subscribe({
      next: () => {
        this.saving = false;
        this.notify.success(this.editId ? 'Updated successfully' : 'Payment method added');
        this.closeModal();
        this.load();
      },
      error: (err) => {
        this.saving = false;
        this.notify.error(err.error?.message || 'Save failed');
      },
    });
  }

  closeModal(): void {
    this.modalOpen = false;
    this.editId = null;
  }

  // ── Toggle status ─────────────────────────────────────────
  toggleStatus(source: PaymentSource): void {
    this.paymentSourcesService.toggle(source.id).subscribe({
      next: () => this.load(),
      error: () => this.notify.error('Toggle failed'),
    });
  }

  // ── Delete ─────────────────────────────────────────────────
  async confirmDelete(source: PaymentSource): Promise<void> {
    const confirmed = await this.confirmService.show({
      title: 'Delete Payment Method',
      message: `Are you sure you want to delete ${source.name}? This cannot be undone.`,
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;

    this.paymentSourcesService.remove(source.id).subscribe({
      next: () => {
        this.notify.success('Deleted');
        this.load();
      },
      error: () => this.notify.error('Delete failed'),
    });
  }
}

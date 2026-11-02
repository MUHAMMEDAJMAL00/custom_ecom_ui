import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../../../core/services/notification.service';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-settings-list',
  standalone: false,
  templateUrl: './settings-list.component.html',
  styleUrl: './settings-list.component.css',
})
export class SettingsListComponent implements OnInit {
  configRows = [
    { key: 'company_name', type: 'string', label: 'Company Name', hint: 'Your business display name' },
    { key: 'company_phone', type: 'string', label: 'Company Phone', hint: 'Contact phone number' },
    { key: 'company_email', type: 'string', label: 'Company Email', hint: 'Business email address' },
    { key: 'company_address', type: 'text', label: 'Address', hint: 'Full business address' },
    { key: 'currency_symbol', type: 'string', label: 'Currency Symbol', hint: 'Symbol shown on receipts and invoices' },
  ];
  invoiceRows = [
    { key: 'invoice_prefix', type: 'string', label: 'Invoice Prefix', hint: 'Prepended to invoice numbers (e.g. INV-)' },
    { key: 'receipt_header', type: 'text', label: 'Receipt Header Text', hint: 'Printed at the top of each receipt' },
    { key: 'receipt_footer', type: 'text', label: 'Receipt Footer Text', hint: 'Printed at the bottom of each receipt' },
  ];
  taxRows = [
    { key: 'tax_rate', type: 'number', label: 'Default Tax Rate (%)', hint: 'Applied to sales unless overridden per product' },
    { key: 'loyalty_earn_rate', type: 'number', label: 'Points per ₹ Spent', hint: 'Loyalty points earned per rupee on each sale' },
    { key: 'loyalty_redeem_rate', type: 'number', label: 'Points per ₹ Redeemed', hint: 'How many points equal ₹1 when redeeming' },
    { key: 'loyalty_expiry_days', type: 'number', label: 'Points Expiry (days)', hint: 'Days before loyalty points expire; 0 = never expire' },
  ];
  inventoryRows = [
    { key: 'low_stock_threshold', type: 'number', label: 'Default Low Stock Alert Qty', hint: 'Products below this quantity trigger a low-stock alert' },
  ];

  values: Record<string, string> = {};
  saving: Record<string, boolean> = {};
  savedText: Record<string, string> = {};

  constructor(private service: SettingsService, private notify: NotificationService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.service.getAll().subscribe({
      next: (data: any) => {
        if (Array.isArray(data)) {
          data.forEach((item: any) => {
            const k = item.config_key || item.key;
            if (k) this.values[k] = item.config_value ?? item.value ?? '';
          });
        } else if (typeof data === 'object') {
          Object.keys(data).forEach((k) => { this.values[k] = data[k]; });
        }
      },
      error: (err: any) => this.notify.error('Failed to load settings'),
    });
  }

  saveRow(key: string, dataType: string): void {
    this.saving[key] = true;
    const rawVal = this.values[key] || '';
    const configValue = dataType === 'number' ? String(parseFloat(rawVal) || 0) : rawVal.trim();
    this.service.set({ config_key: key, config_value: configValue, data_type: dataType }).subscribe({
      next: (res: any) => {
        this.saving[key] = false;
        this.savedText[key] = 'Saved!';
        this.notify.success('Saved: ' + this.keyLabel(key));
        setTimeout(() => { this.savedText[key] = ''; }, 1200);
      },
      error: (err: any) => { this.saving[key] = false; this.notify.error('Failed to save ' + this.keyLabel(key)); },
    });
  }

  keyLabel(key: string): string {
    const map: Record<string, string> = {
      company_name: 'Company Name', company_phone: 'Company Phone', company_email: 'Company Email',
      company_address: 'Address', currency_symbol: 'Currency Symbol', invoice_prefix: 'Invoice Prefix',
      receipt_header: 'Receipt Header', receipt_footer: 'Receipt Footer', tax_rate: 'Tax Rate',
      loyalty_earn_rate: 'Earn Rate', loyalty_redeem_rate: 'Redeem Rate',
      loyalty_expiry_days: 'Points Expiry', low_stock_threshold: 'Low Stock Threshold',
    };
    return map[key] || key;
  }
}

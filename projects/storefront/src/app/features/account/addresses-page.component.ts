import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { CustomerAddress } from '../../core/models/customer.model';
import { CustomerAuthService } from '../../core/services/customer-auth.service';

type AddressDraft = Omit<CustomerAddress, 'id'>;

const EMPTY: AddressDraft = {
  name: '',
  phone: '',
  address_type: 'Home',
  full_address: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'India',
  is_default: 0,
};

/** /addresses — the customer's saved delivery addresses (up to five). */
@Component({
  selector: 'app-addresses-page',
  standalone: false,
  templateUrl: './addresses-page.component.html',
  styleUrls: ['./addresses-page.component.scss'],
})
export class AddressesPageComponent implements OnInit {
  addresses: CustomerAddress[] = [];
  draft: AddressDraft = { ...EMPTY };
  editingId: number | null = null;
  showForm = false;
  loading = true;
  saving = false;
  error = '';
  success = '';

  constructor(readonly auth: CustomerAuthService) {}

  ngOnInit(): void {
    this.load();
  }

  get maxReached(): boolean {
    return this.addresses.length >= 5;
  }

  load(): void {
    this.loading = true;
    this.auth.request<CustomerAddress[]>('GET', '/storefront/addresses').subscribe({
      next: (addresses) => {
        this.addresses = addresses;
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.error = CustomerAuthService.errorMessage(err, 'Could not load your addresses.');
      },
    });
  }

  startAdd(): void {
    if (this.maxReached) {
      this.error = 'You can save up to 5 addresses. Delete one first.';
      return;
    }
    this.draft = { ...EMPTY, is_default: this.addresses.length ? 0 : 1 };
    this.editingId = null;
    this.showForm = true;
    this.error = '';
    this.success = '';
  }

  startEdit(address: CustomerAddress): void {
    this.draft = {
      name: address.name,
      phone: address.phone,
      address_type: address.address_type,
      full_address: address.full_address,
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country || 'India',
      is_default: address.is_default,
    };
    this.editingId = address.id;
    this.showForm = true;
    this.error = '';
    this.success = '';
  }

  cancel(): void {
    this.showForm = false;
    this.editingId = null;
  }

  save(): void {
    this.error = '';
    if (!this.draft.name.trim() || !this.draft.phone.trim() || !this.draft.full_address.trim()) {
      this.error = 'Name, phone and address are required.';
      return;
    }
    if (!/^[0-9]{6}$/.test(this.draft.postal_code)) {
      this.error = 'PIN code must be 6 digits.';
      return;
    }

    this.saving = true;
    const body = {
      ...this.draft,
      name: this.draft.name.trim(),
      phone: this.draft.phone.trim(),
      full_address: this.draft.full_address.trim(),
      city: this.draft.city.trim(),
      state: this.draft.state.trim(),
      postal_code: this.draft.postal_code.trim(),
      country: (this.draft.country || 'India').trim(),
      is_default: this.draft.is_default ? 1 : 0,
    };
    const request = this.editingId
      ? this.auth.request<CustomerAddress>('PUT', `/storefront/addresses/${this.editingId}`, body)
      : this.auth.request<CustomerAddress>('POST', '/storefront/addresses', body);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.showForm = false;
        this.editingId = null;
        this.success = 'Address saved.';
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.saving = false;
        this.error = CustomerAuthService.errorMessage(err, 'Could not save this address.');
      },
    });
  }

  makeDefault(address: CustomerAddress): void {
    this.auth.request<CustomerAddress>('PUT', `/storefront/addresses/${address.id}`, { is_default: 1 }).subscribe({
      next: () => {
        this.success = 'Default address updated.';
        this.load();
      },
      error: (err: HttpErrorResponse) => (this.error = CustomerAuthService.errorMessage(err, 'Could not update the address.')),
    });
  }

  remove(address: CustomerAddress): void {
    if (!confirm(`Delete the address for ${address.name}?`)) return;
    this.auth.request<unknown>('DELETE', `/storefront/addresses/${address.id}`).subscribe({
      next: () => {
        this.success = 'Address deleted.';
        this.load();
      },
      error: (err: HttpErrorResponse) => (this.error = CustomerAuthService.errorMessage(err, 'Could not delete the address.')),
    });
  }

  lines(address: CustomerAddress): string {
    return [address.full_address, address.street, address.city, address.state, address.postal_code, address.country]
      .filter(Boolean)
      .join(', ');
  }
}

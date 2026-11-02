import { Component, OnDestroy, OnInit } from '@angular/core';
import { NotificationService } from '../../../../core/services/notification.service';
import { CashMovement, CashRegister, CashRegisterHistory } from '../../models/cash-register.model';
import { CashRegisterService } from '../../services/cash-register.service';

@Component({
  selector: 'app-cash-register',
  standalone: false,
  templateUrl: './cash-register.component.html',
  styleUrl: './cash-register.component.css',
})
export class CashRegisterComponent implements OnInit, OnDestroy {
  activeTab: 'current' | 'history' = 'current';

  // Current register
  activeReg: CashRegister | null = null;
  loadingStatus = false;
  movements: CashMovement[] = [];

  // Computed stats
  openingBal = 0;
  expectedBal = 0;
  totalCashIn = 0;
  totalCashOut = 0;

  // History
  history: CashRegisterHistory[] = [];
  historyLoading = false;

  // Drawers
  drawerOpen = false;
  drawerMode: 'open' | 'close' | 'cash_in' | 'cash_out' = 'open';
  drawerTitle = '';
  saving = false;

  // Open register fields
  openBal: number | null = null;
  openNotes = '';
  suggestedHint = '';

  // Close register fields
  closeBal: number | null = null;
  closeNotes = '';
  closeDiff: number | null = null;

  // Cash in/out fields
  movAmount: number | null = null;
  movNotes = '';

  private pollTimer: any;

  constructor(
    private service: CashRegisterService,
    private notify: NotificationService,
  ) {}

  ngOnInit(): void {
    this.loadStatus();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  // ── Data loading ──
  loadStatus(): void {
    this.loadingStatus = true;
    this.service.getActive().subscribe({
      next: (reg) => {
        this.loadingStatus = false;
        if (reg && reg.id) {
          this.activeReg = reg;
          this.computeStats(reg);
          this.startPolling();
        } else {
          this.activeReg = null;
          this.stopPolling();
        }
      },
      error: () => { this.loadingStatus = false; this.activeReg = null; this.stopPolling(); },
    });
  }

  computeStats(reg: CashRegister): void {
    const movs = reg.movements || [];
    this.openingBal = parseFloat(String(reg.opening_balance || 0));
    this.totalCashIn = movs.filter((m) => m.movement_type === 'cash_in').reduce((s, m) => s + parseFloat(String(m.amount || 0)), 0);
    this.totalCashOut = movs.filter((m) => m.movement_type === 'cash_out').reduce((s, m) => s + parseFloat(String(m.amount || 0)), 0);
    this.expectedBal = parseFloat(String(reg.expected_balance || (this.openingBal + this.totalCashIn - this.totalCashOut)));
    this.movements = movs;
  }

  loadHistory(): void {
    this.historyLoading = true;
    this.service.getAll().subscribe({
      next: (list) => { this.history = list; this.historyLoading = false; },
      error: () => { this.historyLoading = false; },
    });
  }

  switchTab(tab: 'current' | 'history'): void {
    this.activeTab = tab;
    if (tab === 'history') { this.stopPolling(); this.loadHistory(); }
    else if (this.activeReg) this.startPolling();
  }

  // ── Polling ──
  startPolling(): void {
    this.stopPolling();
    this.pollTimer = setInterval(() => {
      if (this.activeTab === 'current') this.loadStatus();
    }, 5000);
  }

  stopPolling(): void {
    if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
  }

  // ── Open register ──
  openOpenDrawer(): void {
    this.drawerMode = 'open';
    this.drawerTitle = 'Open Cash Register';
    this.saving = false;
    this.openNotes = '';
    this.service.getSuggestedOpening().subscribe({
      next: (res) => {
        this.openBal = res.suggested || 0;
        this.suggestedHint = res.source
          ? 'Last closing balance from ' + new Date(res.source.closed_at).toLocaleDateString('en-IN') + ' was ₹' + res.suggested.toFixed(2)
          : 'Enter the cash amount available at register opening.';
        this.drawerOpen = true;
      },
      error: () => { this.openBal = 0; this.suggestedHint = 'Enter the cash amount available at register opening.'; this.drawerOpen = true; },
    });
  }

  doOpenRegister(): void {
    if (this.openBal === null || this.openBal < 0) { this.notify.warning('Enter a valid opening balance'); return; }
    this.saving = true;
    this.service.open({ opening_balance: this.openBal, notes: this.openNotes.trim() || undefined }).subscribe({
      next: () => {
        this.saving = false;
        this.notify.success('Cash register opened');
        this.drawerOpen = false;
        this.loadStatus();
      },
      error: (err) => { this.saving = false; this.notify.error(err.error?.message || 'Failed to open'); },
    });
  }

  // ── Close register ──
  openCloseDrawer(): void {
    if (!this.activeReg) return;
    this.drawerMode = 'close';
    this.drawerTitle = 'Close Cash Register';
    this.saving = false;
    this.closeBal = null;
    this.closeNotes = '';
    this.closeDiff = null;
    this.drawerOpen = true;
  }

  onCloseBalChange(): void {
    if (this.closeBal === null || isNaN(this.closeBal) || this.closeBal < 0 || !this.activeReg) {
      this.closeDiff = null;
      return;
    }
    this.closeDiff = this.closeBal - this.expectedBal;
  }

  doCloseRegister(): void {
    if (this.closeBal === null || this.closeBal < 0 || isNaN(this.closeBal)) {
      this.notify.warning('Enter the closing balance');
      return;
    }
    this.saving = true;
    this.stopPolling();
    this.service.close(this.activeReg!.id, { closing_balance: this.closeBal, notes: this.closeNotes.trim() || undefined }).subscribe({
      next: () => {
        this.saving = false;
        this.notify.success('Cash register closed');
        this.drawerOpen = false;
        this.activeReg = null;
        this.switchTab('history');
      },
      error: (err) => { this.saving = false; this.notify.error(err.error?.message || 'Failed to close'); this.startPolling(); },
    });
  }

  // ── Cash in / out ──
  openMovementDrawer(type: 'cash_in' | 'cash_out'): void {
    if (!this.activeReg) { this.notify.warning('No active register'); return; }
    this.drawerMode = type;
    this.drawerTitle = type === 'cash_in' ? 'Cash In' : 'Cash Out';
    this.saving = false;
    this.movAmount = null;
    this.movNotes = '';
    this.drawerOpen = true;
  }

  doAddMovement(): void {
    if (!this.movAmount || this.movAmount <= 0 || !this.activeReg) {
      this.notify.warning('Enter a valid amount');
      return;
    }
    this.saving = true;
    this.service.addMovement(this.activeReg.id, {
      movement_type: this.drawerMode,
      amount: this.movAmount,
      notes: this.movNotes.trim() || undefined,
    }).subscribe({
      next: () => {
        this.saving = false;
        this.notify.success((this.drawerMode === 'cash_in' ? 'Cash In' : 'Cash Out') + ' recorded');
        this.drawerOpen = false;
        this.loadStatus();
      },
      error: (err) => { this.saving = false; this.notify.error(err.error?.message || 'Failed'); },
    });
  }

  // ── Drawer save ──
  handleSave(): void {
    if (this.drawerMode === 'open') this.doOpenRegister();
    else if (this.drawerMode === 'close') this.doCloseRegister();
    else this.doAddMovement();
  }

  // ── Helpers ──
  formatCurrency(n: number | string): string {
    return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(s: string): string {
    if (!s) return '—';
    return new Date(s).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  formatTime(s: string): string {
    if (!s) return '—';
    return new Date(s).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  movementBadgeClass(type: string): string {
    const map: Record<string, string> = { cash_in: 'mov-cash-in', cash_out: 'mov-cash-out', sale: 'mov-sale', refund: 'mov-refund' };
    return map[type] || 'mov-other';
  }

  movementLabel(type: string): string {
    const map: Record<string, string> = { cash_in: 'Cash In', cash_out: 'Cash Out', sale: 'Sale', refund: 'Refund' };
    return map[type] || type || '—';
  }

  isCashIn(type: string): boolean {
    return type === 'cash_in' || type === 'sale';
  }
}

import { shopUrl } from '../../../../core/utils/shop-url';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DashboardSummary } from '../../models/dashboard-summary.model';

declare var ApexCharts: any;

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, OnDestroy {
  summary: DashboardSummary | null = null;
  loading = true;
  errorMessage = '';
  lastUpdated = '';
  private chart: any = null;
  private refreshTimer: any;

  constructor(private api: ApiService, public auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.load();
    this.refreshTimer = setInterval(() => this.load(), 60000);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    if (this.chart) this.chart.destroy();
  }

  private ensureChart(): void {
    if (this.chart) return;
    const el = document.getElementById('sales-chart');
    if (!el || typeof ApexCharts === 'undefined') return;
    const days = this.getLast7Days();
    this.chart = new ApexCharts(el, {
      chart: { type: 'area', height: 280, toolbar: { show: false } },
      colors: ['#c8102e', '#8b0a1e', '#e2a3ac'],
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 90, 100] } },
      stroke: { curve: 'smooth', width: 2.5 },
      dataLabels: { enabled: false },
      series: [
        { name: 'Income', data: [0, 0, 0, 0, 0, 0, 0] },
        { name: 'Profit', data: [0, 0, 0, 0, 0, 0, 0] },
        { name: 'Expense', data: [0, 0, 0, 0, 0, 0, 0] },
      ],
      xaxis: {
        categories: days,
        labels: { style: { fontSize: '11px', colors: '#9c8b91' } },
        axisBorder: { show: false }, axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          formatter: (v: number) => '₹' + Math.round(v).toLocaleString('en-IN'),
          style: { fontSize: '10px', colors: '#9c8b91' },
        },
      },
      grid: { borderColor: '#f6e7e9', strokeDashArray: 4 },
      tooltip: { y: { formatter: (v: number) => '₹' + Number(v).toLocaleString('en-IN') } },
      legend: { show: false },
    });
    this.chart.render();
  }

  getLast7Days(): string[] {
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      days.push(d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }));
    }
    return days;
  }

  private updateChart(): void {
    if (!this.chart || !this.summary?.weekly_stats?.length) return;
    const stats = this.summary.weekly_stats;
    this.chart.updateOptions({
      xaxis: {
        categories: stats.map((w) => {
          const d = new Date(w.date);
          return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        }),
      },
    });
    this.chart.updateSeries([
      { name: 'Income', data: stats.map((w) => w.income ?? 0) },
      { name: 'Profit', data: stats.map((w) => w.profit ?? 0) },
      { name: 'Expense', data: stats.map((w) => w.expense ?? 0) },
    ]);
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.api.get<DashboardSummary>('/dashboard/summary').subscribe({
      next: (res) => {
        this.summary = res.data;
        this.loading = false;
        this.lastUpdated = 'Updated ' + new Date().toLocaleTimeString();
        setTimeout(() => {
          this.ensureChart();
          this.updateChart();
        }, 100);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to load dashboard.';
        this.loading = false;
      },
    });
  }

  goToSales(): void {
    this.router.navigate([shopUrl('/sales/list')]);
  }

  goToCustomers(): void {
    this.router.navigate([shopUrl('/customers')]);
  }

  formatCurrency(n: number | string): string {
    return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}

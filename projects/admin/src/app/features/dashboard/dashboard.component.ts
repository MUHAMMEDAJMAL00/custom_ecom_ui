import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { DashboardData, ModuleUsage, SignupTrendPoint } from '../../core/models/dashboard.model';
import { ApiService } from '../../core/services/api.service';
import { initials, tenantStatusClass, tenantStatusLabel } from '../../core/utils/display.util';

interface ChartPoint {
  x: number;
  y: number;
  value: number;
  label: string;
  title: string;
}

interface ChartTick {
  y: number;
  label: string;
}

interface TrendChart {
  points: ChartPoint[];
  linePath: string;
  areaPath: string;
  ticks: ChartTick[];
}

const CHART = {
  width: 720,
  height: 260,
  top: 22,
  right: 18,
  bottom: 38,
  left: 46,
};

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  data: DashboardData | null = null;
  chart: TrendChart | null = null;
  loading = true;
  errorMessage = '';
  lastUpdated = '';

  readonly statusLabel = tenantStatusLabel;
  readonly statusClass = tenantStatusClass;
  readonly initials = initials;

  constructor(private api: ApiService) {}

  get topModule(): ModuleUsage | null {
    const rows = this.data?.module_usage ?? [];
    if (!rows.length) return null;
    return rows.reduce((best, row) => (row.tenants > best.tenants ? row : best), rows[0]);
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';

    this.api.get<DashboardData>('/platform/dashboard').subscribe({
      next: (data) => {
        this.data = data;
        this.chart = this.buildChart(data.signup_trend ?? []);
        this.loading = false;
        this.lastUpdated =
          'Updated ' +
          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.errorMessage =
          error.error?.message || 'Could not load the platform dashboard.';
      },
    });
  }

  private buildChart(rows: SignupTrendPoint[]): TrendChart {
    const series = rows.length ? rows : this.emptyWeek();
    const values = series.map((row) => Math.max(0, Number(row.count) || 0));
    const highest = Math.max(1, ...values);
    const step = Math.max(1, Math.ceil(highest / 4));
    const max = step * 4;

    const innerWidth = CHART.width - CHART.left - CHART.right;
    const innerHeight = CHART.height - CHART.top - CHART.bottom;
    const baseline = CHART.top + innerHeight;

    const points: ChartPoint[] = series.map((row, index) => {
      const value = values[index];
      const x =
        CHART.left +
        (series.length === 1 ? innerWidth / 2 : (innerWidth * index) / (series.length - 1));
      const y = baseline - (value / max) * innerHeight;
      const date = new Date(`${row.date}T00:00:00`);

      return {
        x,
        y,
        value,
        label: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        title: `${date.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
        })}: ${value} new tenant${value === 1 ? '' : 's'}`,
      };
    });

    const linePath = this.smoothPath(points);
    const areaPath = points.length
      ? `${linePath} L ${this.round(points[points.length - 1].x)} ${this.round(baseline)} ` +
        `L ${this.round(points[0].x)} ${this.round(baseline)} Z`
      : '';

    const ticks: ChartTick[] = Array.from({ length: 5 }, (_, index) => {
      const value = step * (4 - index);
      return {
        y: baseline - (value / max) * innerHeight,
        label: String(value),
      };
    });

    return { points, linePath, areaPath, ticks };
  }

  private smoothPath(points: ChartPoint[]): string {
    if (!points.length) return '';

    const first = points[0];
    let path = `M ${this.round(first.x)} ${this.round(first.y)}`;

    for (let index = 1; index < points.length; index += 1) {
      const previous = points[index - 1];
      const current = points[index];
      const middle = (previous.x + current.x) / 2;

      path +=
        ` C ${this.round(middle)} ${this.round(previous.y)}, ` +
        `${this.round(middle)} ${this.round(current.y)}, ` +
        `${this.round(current.x)} ${this.round(current.y)}`;
    }

    return path;
  }

  private emptyWeek(): SignupTrendPoint[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - index));
      return { date: this.dateKey(date), count: 0 };
    });
  }

  private dateKey(date: Date): string {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}

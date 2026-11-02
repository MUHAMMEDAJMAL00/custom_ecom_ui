export interface DashboardSummary {
  today: {
    sales_count: number;
    sales_total: number;
    cost: number;
    profit: number;
    purchases_count: number;
    purchases_total: number;
  };
  inventory: {
    total_stock_value: number;
    low_stock_products: number;
  };
  customers: {
    total: number;
  };
  vendors: {
    total_dues: number;
  };
  cash_register: { status: 'open' | 'closed'; opened_at?: string; opening_balance?: number };
  weekly_stats: Array<{ date: string; income: number; expense: number; profit: number }>;
  recent_sales: Array<{
    id: number;
    invoice_number: string;
    total_amount: string | number;
    paid_amount: string | number;
    due_amount: string | number;
    total_profit: number;
    status: string;
    created_at: string;
    Customer?: { name: string; phone: string } | null;
    items?: unknown[];
  }>;
  top_products: Array<{ product_id: number; name: string; total_qty: number; total_revenue: number }>;
}

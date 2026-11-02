/**
 * YYYY-MM-DD for a date in the browser's time zone. Date.toISOString() gives the UTC
 * date, which in India is the previous day until 05:30.
 */
export function localDate(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

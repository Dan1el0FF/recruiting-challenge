import type { OrderRow } from '../dal/orders-dal.js';

function escapeCSVField(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const CSV_HEADERS = ['Order ID', 'Customer Email', 'Amount', 'Type', 'Status', 'Date'];

export function ordersToCSV(orders: OrderRow[]): string {
  const rows = [CSV_HEADERS.join(',')];

  for (const order of orders) {
    const amountInDollars = (order.total_amount / 100).toFixed(2);
    const row = [
      order.id,
      order.customer_email,
      amountInDollars,
      order.type,
      order.status,
      order.created_at,
    ].map(escapeCSVField);
    rows.push(row.join(','));
  }

  return rows.join('\n');
}
const select = document.getElementById('merchant-select');
const totalOrdersEl = document.getElementById('total-orders');
const uniqueCustomersEl = document.getElementById('unique-customers');
const avgOrderEl = document.getElementById('avg-order');
const revenue30dEl = document.getElementById('revenue-30d');
const ordersTbody = document.getElementById('orders-tbody');
const downloadBtn = document.getElementById('download-csv-btn');

function api(path) {
  return fetch(path, { headers: { 'X-Merchant-Id': select.value } }).then((r) => r.json());
}

function money(cents) {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

async function downloadCSV() {
  const now = new Date();
  const thirtyAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const from = isoDate(thirtyAgo);
  const to = isoDate(now);

  const response = await fetch(`/api/orders/export?from=${from}&to=${to}`, {
    headers: { 'X-Merchant-Id': select.value },
  });

  if (!response.ok) {
    alert('Error al descargar el CSV');
    return;
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `orders_${from}_to_${to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function refresh() {
  const summary = await api('/api/metrics/summary');
  totalOrdersEl.textContent = summary.total_orders ?? '—';
  uniqueCustomersEl.textContent = summary.unique_customers ?? '—';
  avgOrderEl.textContent = money(summary.avg_order_value_cents ?? 0);

  const now = new Date();
  const thirtyAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const revenue = await api(`/api/revenue?from=${isoDate(thirtyAgo)}&to=${isoDate(now)}`);
  revenue30dEl.textContent = money(revenue.revenue_cents ?? 0);

  const ordersRes = await api('/api/orders?limit=10');
  ordersTbody.innerHTML = '';
  for (const o of ordersRes.orders ?? []) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${new Date(o.created_at).toLocaleDateString()}</td>
      <td>${o.customer_email}</td>
      <td>${o.type}</td>
      <td>${money(o.total_amount)}</td>
    `;
    ordersTbody.appendChild(tr);
  }
}

select.addEventListener('change', refresh);
downloadBtn.addEventListener('click', downloadCSV);
refresh();
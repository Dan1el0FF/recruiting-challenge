# API reference

All endpoints under `/api/*` (except `/api/health`) require the `X-Merchant-Id` header, identifying the merchant making the request. Requests without it receive `401 { "error": "missing_merchant_id" }`.

## `GET /api/health`
No auth required. Returns `{ ok: true }`.

## `GET /api/orders`
List orders for the authenticated merchant.

**Query params (all optional):**
- `from`, `to` — ISO date strings (`YYYY-MM-DD`). If both are provided, results are filtered to that range.
- `limit` — max number of results. Default `100`.

**Response:** `{ orders: OrderRow[] }`, ordered by `created_at` descending.

## `GET /api/orders/:id`
Get a single order by ID.

Only returns the order if it belongs to the requesting merchant (`X-Merchant-Id`). If the order exists but belongs to a different merchant, or doesn't exist at all, returns `404 { "error": "not_found" }` — the response does not distinguish between the two cases, to avoid leaking whether an order ID exists.

## `POST /api/orders`
Creates a new order for the authenticated merchant.

**Body:**
```json
{
  "customer_email": "string, required — must match a basic email pattern (user@domain.tld)",
  "total_amount": "number, required — in cents",
  "type": "'sale' | 'refund', optional — defaults to 'sale'"
}
```

`customer_email` is validated against a simple regex (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) before the order is created. Requests with a malformed email, or a missing/non-numeric `total_amount`, receive `400 { "error": "invalid_body" }`.

**Response:** `201 { order: OrderRow }`.

## `GET /api/orders/export`
Exports the merchant's orders for a given date range as a CSV file.

**Query params (required):**
- `from`, `to` — ISO date strings (`YYYY-MM-DD`).

Missing either param returns `400 { "error": "missing_date_range" }`.

**Response:** `200`, `Content-Type: text/csv`, with a `Content-Disposition: attachment` header so browsers download the file directly.

**Columns:** `Order ID, Customer Email, Amount, Type, Status, Date`

- `Amount` is in dollars (converted from the stored cents value, 2 decimal places). It is **not** signed by type — a refund's amount appears as a positive number; consult the `Type` column to know whether it should be added or subtracted.
- Fields are CSV-escaped (wrapped in quotes, internal quotes doubled) when they contain a comma, quote, or newline.
- Result set is currently capped at 10,000 rows loaded into memory; not streamed. Fine at current data volumes — would need revisiting for much larger exports.

## `GET /api/revenue?from=...&to=...`
Total net revenue for the merchant in the given date range (both params required).

Revenue is calculated as **sum of `sale` orders minus sum of `refund` orders** in the range — refunds reduce revenue, they are not counted as additional income.

**Response:**
```json
{
  "merchant_id": "string",
  "from": "string",
  "to": "string",
  "revenue_cents": "number",
  "revenue": "number (revenue_cents / 100)"
}
```

## `GET /api/metrics/summary`
Returns summary stats for the authenticated merchant.

**Response:**
```json
{
  "merchant_id": "string",
  "total_orders": "number — count of all orders (sale + refund)",
  "unique_customers": "number — distinct customer_email values",
  "avg_order_value_cents": "number — average total_amount across 'sale' orders only (refunds excluded)"
}
```

## `GET /api/metrics/top-customers`
Returns customers ranked by net spend, descending.

**Query params:**
- `limit` — max number of customers returned. Default `5`.

**Response:**
```json
{
  "customers": [
    {
      "customer_email": "string",
      "order_count": "number — count of all orders (sale + refund) for this customer",
      "total_spent": "number — sum of sales minus sum of refunds, in cents"
    }
  ]
}
```

**Note:** this endpoint is not currently wired into the dashboard UI (`public/`) — the data is available via API but has no visual surface yet.
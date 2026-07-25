# Architecture

## Overview

This is a small merchant sales dashboard: a Node/TypeScript backend (Express + SQLite) serving a JSON API under `/api/*`, plus a static HTML/vanilla-JS frontend served from `public/`. There is no frontend framework — `app.js` talks to the API with `fetch` and renders results directly into the DOM.

Each merchant's data is isolated by `merchant_id`. The client identifies itself via the `X-Merchant-Id` header on every request (see [Auth](#auth) below).

## Modules

- **`server.ts`** — Express bootstrapper. Initializes the schema, seeds the DB if empty, wires routers to their base paths (`/api/orders`, `/api/revenue`, `/api/metrics`), and mounts a generic error handler.

- **`db.ts`** — SQLite connection (`better-sqlite3`) + schema definition. Exports a single shared `db` instance used by `orders-dal.ts` and by `test/*.ts`. WAL mode and foreign keys are enabled.

- **`auth.ts`** — Request authentication. Trusts the `X-Merchant-Id` header as-is; there is no signature or lookup against the `merchants` table to confirm the ID is real. This is intentionally simple — a real system would use a signed token (JWT or similar). Requests without the header get `401`.
  - **Known gap:** because there's no verification that the merchant ID actually exists, any string works as a "valid" identity. This doesn't currently allow cross-merchant data access on its own — see the note on `orders-dal.ts` below for how that risk was closed at the data layer instead.

- **`dal/orders-dal.ts`** — Data-access layer for orders. All order queries route through `ordersDal`; the intent is to have one place to add auditing, caching, or tenancy rules. Currently followed by `orders.ts` and `revenue.ts`; **not** followed by `metrics.ts` (see below).
  - `getById(id, merchantId)` requires **both** the order ID and the requesting merchant's ID, and filters on both in the SQL query (`WHERE id = ? AND merchant_id = ?`). This was a deliberate fix: the original version filtered by `id` only, which let any authenticated merchant read any other merchant's order by ID (IDOR). Filtering at the query level — rather than fetching the row and checking `merchant_id` in application code — means the function can never leak a row to a caller who doesn't already provide the right merchant ID, regardless of how future code calls it.
  - `sumAmountByMerchant(...)` computes **net** revenue: sum of `sale` orders minus sum of `refund` orders in the date range. The original implementation summed all `total_amount` values regardless of `type`, which double-counted refunds as additional income rather than treating them as money paid back. Refund rows store a positive `total_amount` (they represent the amount reversed, not a negative delta), so the subtraction has to happen in the query — a plain `SUM(total_amount)` will always overstate revenue when refunds exist.

- **`routes/`** — Express routers, one file per resource.
  - `orders.ts` — CRUD-ish operations on orders, plus CSV export (below). `POST /` validates `customer_email` against a basic regex (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) before persisting it. This closes a stored-XSS path: the dashboard (`app.js`) renders `customer_email` via `innerHTML`, so unvalidated input containing HTML/JS would have executed in the browser of anyone viewing the dashboard. The regex rejects the characters (`<`, `>`, quotes) needed to build a payload, without requiring exhaustive RFC-5322 email validation, which was more rigor than the actual risk (arbitrary HTML injection) called for.
    - **Known residual risk:** `app.js` still uses `innerHTML` to render order rows. Input validation closes the currently-known entry point, but it's a single point of failure — a future endpoint that creates orders without going through this same validation (a bulk import script, for example) would reintroduce the vulnerability, since the render side does no escaping of its own. Defense-in-depth (rendering with `textContent` / building `<td>` nodes instead of a template string) was considered and deliberately not implemented, to keep this fix scoped to the known attack path.
  - `revenue.ts` — thin wrapper around `ordersDal.sumAmountByMerchant`.
  - `metrics.ts` — dashboard summary stats. **Does not use `ordersDal`** — it opens its own separate `better-sqlite3` connection (`readonly: true`) instead of importing the shared `db` from `db.ts`. This predates the current changes and was left as-is; see [Open items](#open-items).
    - `avg_order_value_cents` filters to `type = 'sale'` only — refunds are excluded from the average entirely, rather than netted against it, since an "average sale value" that mixes in reversed transactions isn't a meaningful number.
    - `top-customers`'s `total_spent` nets sales minus refunds per customer, same approach as `sumAmountByMerchant`.
    - This endpoint's data is not currently surfaced anywhere in `public/` — the API exists but has no dashboard UI calling it.

- **`lib/csv.ts`** — CSV serialization, used by the orders export endpoint. Was previously an empty, reserved directory (per the original doc); this is its first occupant.
  - `ordersToCSV(orders)` builds the CSV as a string: a fixed header row (`Order ID, Customer Email, Amount, Type, Status, Date`), then one row per order. `total_amount` (stored in cents) is converted to a dollar string with 2 decimals; it is **not** signed by `type` — a refund's amount is positive, same as a sale's, so the `Type` column is what tells a reader whether it should be added or subtracted.
  - Field-level escaping follows the CSV spec: any field containing a comma, double quote, or newline is wrapped in double quotes, with internal double quotes doubled (`"` → `""`). This matters because order data includes user-supplied text (`customer_email`); without escaping, a value like `a,b@example.com` would split into extra columns when opened in a spreadsheet tool.
  - **Known limitation:** the export endpoint loads up to 10,000 rows into memory and serializes them in one pass — there's no streaming. Fine at current data volumes; would need to switch to a streaming response (writing rows to `res` as they're read from the DB, rather than building the whole string first) if per-merchant order counts grow substantially.

- **`scripts/seed.ts`** — populates `merchants` and ~80 sample `orders` on first run. Refund rows are seeded with positive `total_amount`, same as sales — this is what makes the revenue double-counting bug reproducible; it's not a special case the seed script needs to construct deliberately.

## Data model

Two tables: `merchants`, `orders`. See `db.ts` for the canonical DDL.

`orders.type` is one of `'sale' | 'refund'`. A refund row records that a sale was reversed; it does **not** automatically adjust or link back to the original sale row — they're independent rows, related only by `customer_email` and proximity in time, not by a foreign key. Any aggregate that sums `total_amount` across types needs to explicitly account for this (see `orders-dal.ts` above); there's no schema-level guarantee that consumers get this right, which is why this bug existed in three separate places (`revenue.ts`, `metrics.ts` twice) before being fixed.

`total_amount` is stored in **integer cents**, not dollars — this avoids floating-point rounding issues but means every consumer (API responses, the CSV export, the frontend's `money()` formatter) has to remember to divide by 100 at the display boundary. There's no type-level enforcement that a raw `total_amount` isn't accidentally displayed as if it were dollars.

## Auth

See `auth.ts` module notes above. In short: `X-Merchant-Id` header, unsigned, unverified against the `merchants` table. Cross-merchant data leakage risk was closed at the data-access layer (`getById` requiring both `id` and `merchantId`) rather than at the auth layer, since the auth layer's job (as designed) is only to extract *a* claimed identity, not to authorize access to a specific resource — that's a per-resource concern, which is why the fix lives in the DAL.

## Open items

- **`metrics.ts` doesn't go through `ordersDal`.** It opens a second, separate SQLite connection instead of reusing the shared one from `db.ts`. Two concrete costs of this: (1) it duplicates connection setup and diverges from the "all queries go through the DAL" intent stated in this doc, and (2) it made `metrics.ts`'s query logic harder to unit-test — the test suite runs against `DB_PATH=:memory:`, and an in-memory SQLite connection is private to whoever opened it, so `metrics.ts`'s own connection never sees data inserted via the shared `db` in tests. Its two aggregate queries were verified manually against a running server instead (see decision log) rather than with an automated test, as a direct consequence of this.
- **`top-customers` has no dashboard UI.** The endpoint and its (now-corrected) net-spend calculation exist, but nothing in `public/` calls it.
- **No foreign-key link between a refund and the sale it reverses.** Revenue math currently works by summing `type` at the merchant/customer level, not by matching refunds to specific sales. This is fine for aggregate totals but wouldn't support, e.g., "how many of this merchant's sales were later refunded" without a schema change.
- Original stale entries, superseded:
  - ~~Wire `dashboard.tsx` once we pick a frontend framework~~ — went with static HTML+fetch instead.
  - `analytics-events` as its own service vs. a route here — never revisited; no such feature exists yet.
  - Audit logging — still not implemented, still TBD.
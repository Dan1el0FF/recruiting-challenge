import { db } from '../db.js';

export interface OrderRow {
  id: string;
  merchant_id: string;
  customer_email: string;
  total_amount: number;
  type: 'sale' | 'refund';
  status: string;
  created_at: string;
}

/**
 * Data-access layer for orders. All order queries should go through here.
 *
 * - centralized place for query patterns
 * - the place to add auditing, caching, tenancy filters
 * - the seam for swapping the underlying store
 */
export const ordersDal = {
  listByMerchant(merchantId: string, opts: { from?: string; to?: string; limit?: number } = {}): OrderRow[] {
    const limit = opts.limit ?? 100;
    if (opts.from && opts.to) {
      return db
        .prepare(
          `SELECT * FROM orders
           WHERE merchant_id = ? AND created_at >= ? AND created_at < ?
           ORDER BY created_at DESC
           LIMIT ?`,
        )
        .all(merchantId, opts.from, opts.to, limit) as OrderRow[];
    }
    return db
      .prepare(`SELECT * FROM orders WHERE merchant_id = ? ORDER BY created_at DESC LIMIT ?`)
      .all(merchantId, limit) as OrderRow[];
  },

  //esta función tiene fallas de seguridad (se puede eliminar)

  /*getById(id: string): OrderRow | undefined {
    return db.prepare(`SELECT * FROM orders WHERE id = ?`).get(id) as OrderRow | undefined;
  },
  */
  
  //Fix de seguridad: Asegurarse de pedir el merchant id además del orders id

  getById(id: string, merchantId: string): OrderRow | undefined {
  return db.prepare(`SELECT * FROM orders WHERE id = ? AND merchant_id = ?`).get(id, merchantId) as OrderRow | undefined;
  },

  create(order: Omit<OrderRow, 'created_at'>): OrderRow {
    db.prepare(
      `INSERT INTO orders (id, merchant_id, customer_email, total_amount, type, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(order.id, order.merchant_id, order.customer_email, order.total_amount, order.type, order.status);
    return this.getById(order.id, order.merchant_id)!;
  },

  //Fix: esta función calcula incorrectamente las ganancias por que también suma los refunds en vez de restarlos
  /**
   * Sum total_amount over a date range for a merchant.
   * Used by the revenue endpoint.
   */

  /*sumAmountByMerchant(merchantId: string, from: string, to: string): number {
    const row = db
      .prepare(
        `SELECT COALESCE(SUM(total_amount), 0) AS total
         FROM orders
         WHERE merchant_id = ? AND created_at >= ? AND created_at < ?`,
      )
      .get(merchantId, from, to) as { total: number };
    return row.total;
  },
  */

  //Fix: Ahora se calcula correctamente las ganancias restando el rembolso a las ventas
  sumAmountByMerchant(merchantId: string, from: string, to: string): number {
    const row = db
      .prepare(
        `SELECT COALESCE(
          SUM(CASE WHEN type = 'sale' THEN total_amount ELSE 0 END) -
          SUM(CASE WHEN type = 'refund' THEN total_amount ELSE 0 END),
        0) AS total
        FROM orders
        WHERE merchant_id = ? AND created_at >= ? AND created_at < ?`,
      )
      .get(merchantId, from, to) as { total: number };
    return row.total;
  },



};

  
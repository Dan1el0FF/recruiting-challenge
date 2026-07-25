// Set DB_PATH before importing the db module — the connection is created on import.
if (!process.env.DB_PATH) process.env.DB_PATH = ':memory:';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initSchema, db } from '../src/db.js';
import { ordersDal } from '../src/dal/orders-dal.js';

test('orders DAL: create + listByMerchant returns the order', () => {
  initSchema();
  db.prepare(`INSERT OR IGNORE INTO merchants (id, name) VALUES ('m_test', 'Test')`).run();
  const created = ordersDal.create({
    id: 'o1',
    merchant_id: 'm_test',
    customer_email: 'a@b.com',
    total_amount: 5000,
    type: 'sale',
    status: 'completed',
  });
  assert.equal(created.id, 'o1');
  const list = ordersDal.listByMerchant('m_test');
  assert.equal(list.length, 1);
  assert.equal(list[0]!.total_amount, 5000);
});

test('orders DAL: getById returns the order', () => {
  initSchema();
  db.prepare(`INSERT OR IGNORE INTO merchants (id, name) VALUES ('m_test', 'Test')`).run();
  ordersDal.create({
    id: 'o2',
    merchant_id: 'm_test',
    customer_email: 'c@d.com',
    total_amount: 1200,
    type: 'sale',
    status: 'completed',
  });
  const got = ordersDal.getById('o2','m_test');
  assert.equal(got?.total_amount, 1200);
});

//test para comprobar mi fix 1: No entregar datos de orden si le corresponde el dato
test('orders DAL: getById does not leak orders across merchants', () => {
  initSchema();
  db.prepare(`INSERT OR IGNORE INTO merchants (id, name) VALUES ('m_test', 'Test')`).run();
  db.prepare(`INSERT OR IGNORE INTO merchants (id, name) VALUES ('m_other', 'Other')`).run();
  ordersDal.create({
    id: 'o3',
    merchant_id: 'm_test',
    customer_email: 'e@f.com',
    total_amount: 999,
    type: 'sale',
    status: 'completed',
  });

  const got = ordersDal.getById('o3', 'm_other');
  assert.equal(got, undefined);
});

//test para comprobar fix 2: Revenue se calcula correctamente
test('orders DAL: sumAmountByMerchant subtracts refunds from sales', () => {
  initSchema();
  db.prepare(`INSERT OR IGNORE INTO merchants (id, name) VALUES ('m_rev', 'Revenue Test')`).run();

  ordersDal.create({
    id: 'r1',
    merchant_id: 'm_rev',
    customer_email: 'x@y.com',
    total_amount: 10000, // $100.00 en centavos
    type: 'sale',
    status: 'completed',
  });
  ordersDal.create({
    id: 'r2',
    merchant_id: 'm_rev',
    customer_email: 'x@y.com',
    total_amount: 5000, // $50.00
    type: 'sale',
    status: 'completed',
  });
  ordersDal.create({
    id: 'r3',
    merchant_id: 'm_rev',
    customer_email: 'x@y.com',
    total_amount: 3000, // $30.00 refund
    type: 'refund',
    status: 'completed',
  });

  const total = ordersDal.sumAmountByMerchant('m_rev', '2000-01-01', '2100-01-01');
  assert.equal(total, 12000); // 100 + 50 - 30 = $120.00 → 12000 centavos
});
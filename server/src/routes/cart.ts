import { Router } from 'express';
import { db } from '../db/index.js';
import { cartItems, carts, agentHandles } from '../db/schema.js';
import { sql, eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { config } from '../config.js';
import { SettlementService } from '../services/settlement.js';
import { logger } from '../utils/logger.js';

export const cartRouter = Router();

function newId(): string {
  return randomBytes(8).toString('hex');
}

function normalizeUrl(url?: string): string {
  if (!url) return '';
  return url.replace(/^https?:\/\//, '').replace(/\/+$/, '').toLowerCase();
}

cartRouter.post('/add', async (req, res) => {
  const { handle, title, source, product_url, image_url, price_usdc, seller_payto, added_by } = req.body;

  if (!handle || !title || !source) {
    return res.status(400).json({ error: 'handle, title, and source are required' });
  }

  const owner = await db.select().from(agentHandles).where({ handle }).limit(1);
  if (!owner[0]) {
    return res.status(404).json({ error: `Handle '${handle}' not found. Register it first.` });
  }

  const normalized = normalizeUrl(product_url);

  if (normalized) {
    const existing = await db.select().from(cartItems)
      .where(sql`${cartItems.handle} = ${handle} AND ${cartItems.product_url} = ${normalized} AND ${cartItems.status} = 'added'`)
      .limit(1);

    if (existing[0]) {
      return res.json({
        duplicate: true,
        message: 'This item is already in the cart. Do you want another one?',
        item: existing[0],
        item_id: existing[0].id,
      });
    }
  }

  const itemId = `item_${newId()}`;
  const created = await db.insert(cartItems).values({
    id: itemId,
    handle,
    title,
    source,
    product_url: normalized,
    image_url,
    price_usdc,
    seller_payto,
    quantity: 1,
    status: 'added',
    added_by: added_by || 'user',
  }).returning();

  const cart = await db.select().from(carts).where({ handle, status: 'open' }).limit(1);
  if (!cart[0]) {
    await db.insert(carts).values({ id: `cart_${newId()}`, handle, status: 'open', total_usdc: price_usdc || 0 });
  } else {
    await db.update(carts).set({ total_usdc: (cart[0].total_usdc || 0) + (price_usdc || 0), updated_at: new Date().toISOString() })
      .where({ id: cart[0].id });
  }

  res.status(201).json({ duplicate: false, item: created[0], item_id: itemId });
});

cartRouter.post('/confirm-duplicate', async (req, res) => {
  const { item_id } = req.body;
  const item = await db.select().from(cartItems).where({ id: item_id }).limit(1);
  if (!item[0]) return res.status(404).json({ error: 'Item not found' });

  const updated = await db.update(cartItems)
    .set({ quantity: (item[0].quantity || 1) + 1, updated_at: new Date().toISOString() })
    .where({ id: item_id }).returning();

  res.json({ message: 'Quantity increased', item: updated[0] });
});

cartRouter.get('/:handle', async (req, res) => {
  const { handle } = req.params;
  const items = await db.select().from(cartItems)
    .where(sql`${cartItems.handle} = ${handle} AND ${cartItems.status} = 'added'`)
    .orderBy(sql`created_at DESC`);
  const cart = await db.select().from(carts).where({ handle, status: 'open' }).limit(1);

  const total = items.reduce((sum, i) => sum + (i.price_usdc || 0) * (i.quantity || 1), 0);

  res.json({
    handle,
    cart_id: cart[0]?.id,
    total_usdc: parseFloat(total.toFixed(2)),
    count: items.length,
    items,
  });
});

cartRouter.post('/:handle/checkout', async (req, res) => {
  const { handle } = req.params;
  const items = await db.select().from(cartItems)
    .where(sql`${cartItems.handle} = ${handle} AND ${cartItems.status} = 'added'`);

  if (items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  const owner = await db.select().from(agentHandles).where({ handle }).limit(1);
  const missingSeller = items.find(i => !i.seller_payto);
  if (missingSeller) {
    return res.status(400).json({ error: `Item '${missingSeller.title}' has no seller payTo address` });
  }

  const payments = items.map(i => ({
    item_id: i.id,
    title: i.title,
    amount_usdc: (i.price_usdc || 0) * (i.quantity || 1),
    seller_payto: i.seller_payto as string,
  }));
  const total = payments.reduce((sum, p) => sum + p.amount_usdc, 0);

  const mnemonic = config.algorand.walletMnemonic || process.env.AGENT_PRIVATE_KEY;
  if (!mnemonic) {
    return res.status(500).json({
      error: 'Payer mnemonic not configured. Set AGENT_PRIVATE_KEY in .env.',
      batch_payments: payments,
      total_usdc: parseFloat(total.toFixed(2)),
    });
  }

  const settlement = new SettlementService(mnemonic);
  const result = await settlement.settleAtomicSplit(payments);

  if (!result.success) {
    return res.status(502).json({
      error: 'Atomic group settlement failed',
      message: result.error,
      batch_payments: payments,
    });
  }

  const groupId = result.txn_group_id || `cart_${randomBytes(8).toString('hex')}`;

  await db.update(cartItems).set({ status: 'purchased', updated_at: new Date().toISOString() })
    .where(eq(cartItems.handle, handle));

  const cart = await db.select().from(carts).where({ handle, status: 'open' }).limit(1);
  if (cart[0]) {
    await db.update(carts).set({
      status: 'paid',
      total_usdc: parseFloat(total.toFixed(2)),
      txn_group_id: groupId,
      updated_at: new Date().toISOString(),
    }).where({ id: cart[0].id });
  }

  logger.info(`Checkout for ${handle}: ${payments.length} payments, ${total.toFixed(2)} USDC settled in group ${groupId}`);

  res.json({
    success: true,
    handle,
    txn_group_id: groupId,
    txids: result.txids,
    round: result.round,
    total_usdc: parseFloat(total.toFixed(2)),
    batch_payments: payments,
    note: 'All seller payments settled atomically on Algorand in one transaction group.',
  });
});

cartRouter.post('/:handle/clear', async (req, res) => {
  const { handle } = req.params;
  await db.update(cartItems).set({ status: 'removed', updated_at: new Date().toISOString() })
    .where(sql`${cartItems.handle} = ${handle} AND ${cartItems.status} = 'added'`);
  res.json({ success: true });
});
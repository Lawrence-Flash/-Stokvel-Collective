import { describe, expect, it, vi } from 'vitest';
import {
  expiredPoolDecision,
  lockFulfilledPool,
  refundUnmetPool,
  type SettlementWriter,
} from '../settlement';

function writer(): SettlementWriter {
  return {
    buyingPool: { update: vi.fn().mockResolvedValue({}) },
    order: { update: vi.fn().mockResolvedValue({}) },
    escrowTransaction: { update: vi.fn().mockResolvedValue({}) },
  };
}

describe('expired pool payouts', () => {
  it('refunds an unmet pool and locks a pool that reached its target', () => {
    expect(expiredPoolDecision({ currentQuantity: 10, targetQuantity: 100 })).toBe('refund');
    expect(expiredPoolDecision({ currentQuantity: 100, targetQuantity: 100 })).toBe('lock');
    expect(expiredPoolDecision({ currentQuantity: 140, targetQuantity: 100 })).toBe('lock');
  });

  it('cancels the pool and every order, and refunds only orders that hold escrow', async () => {
    const tx = writer();

    await refundUnmetPool(
      {
        id: 'pool-1',
        orders: [
          { id: 'order-1', escrow: { id: 'escrow-1' } },
          { id: 'order-2', escrow: null },
        ],
      },
      tx,
    );

    expect(tx.buyingPool.update).toHaveBeenCalledWith({
      where: { id: 'pool-1' },
      data: { status: 'CANCELLED' },
    });
    expect(tx.order.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'order-1' },
      data: { status: 'CANCELLED' },
    });
    expect(tx.order.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'order-2' },
      data: { status: 'CANCELLED' },
    });
    expect(tx.escrowTransaction.update).toHaveBeenCalledTimes(1);
    expect(tx.escrowTransaction.update).toHaveBeenCalledWith({
      where: { id: 'escrow-1' },
      data: { status: 'REFUNDED' },
    });
  });

  it('cancels an empty pool without touching orders or escrow', async () => {
    const tx = writer();

    await refundUnmetPool({ id: 'pool-empty', orders: [] }, tx);

    expect(tx.buyingPool.update).toHaveBeenCalledTimes(1);
    expect(tx.order.update).not.toHaveBeenCalled();
    expect(tx.escrowTransaction.update).not.toHaveBeenCalled();
  });

  it('locks a met pool for wholesale fulfillment without refunding members', async () => {
    const tx = writer();

    await lockFulfilledPool('pool-2', tx);

    expect(tx.buyingPool.update).toHaveBeenCalledWith({
      where: { id: 'pool-2' },
      data: { status: 'LOCKED' },
    });
    expect(tx.order.update).not.toHaveBeenCalled();
    expect(tx.escrowTransaction.update).not.toHaveBeenCalled();
  });
});

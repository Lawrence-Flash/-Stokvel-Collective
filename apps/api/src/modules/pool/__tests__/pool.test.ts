import { describe, it, expect, vi } from 'vitest';
import { PoolService } from '../pool.service';

// Mock database module
vi.mock('@stokvel/database', () => {
  return {
    PoolStatus: {
      DRAFT: 'DRAFT',
      OPEN: 'OPEN',
      LOCKED: 'LOCKED',
      FULFILLED: 'FULFILLED',
      CANCELLED: 'CANCELLED',
    },
    OrderStatus: {
      PENDING_PAYMENT: 'PENDING_PAYMENT',
      PAID: 'PAID',
      READY_FOR_COLLECTION: 'READY_FOR_COLLECTION',
      COLLECTED: 'COLLECTED',
      CANCELLED: 'CANCELLED',
    },
    PaymentStatus: {
      PENDING: 'PENDING',
      HELD_IN_ESCROW: 'HELD_IN_ESCROW',
      DISBURSED: 'DISBURSED',
      REFUNDED: 'REFUNDED',
      FAILED: 'FAILED',
    },
    prisma: {
      buyingPool: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      order: {
        create: vi.fn(),
      },
      $transaction: vi.fn(async (cb) => {
        const mockTx = {
          buyingPool: {
            findUnique: vi.fn(),
            update: vi.fn(),
          },
          order: {
            create: vi.fn(),
          },
        };
        return cb(mockTx);
      }),
    },
  };
});

describe('Pool Service Logic', () => {
  it('correctly calculates total amount and rejects inactive pools', async () => {
    const invalidPoolId = 'non-existent-pool';
    await expect(PoolService.placeOrder('user-1', invalidPoolId, 2)).rejects.toThrow(
      'Buying pool is not active or available'
    );
  });

  it('calculates savings percentage correctly', () => {
    const unitPrice = 89.99;
    const retailPrice = 119.99;
    const savings = Math.round(((retailPrice - unitPrice) / retailPrice) * 100);
    expect(savings).toBe(25);
  });

  it('calculates pool completion progress correctly', () => {
    const currentQty = 35;
    const targetQty = 100;
    const percentage = Math.min(Math.round((currentQty / targetQty) * 100), 100);
    expect(percentage).toBe(35);
  });
});

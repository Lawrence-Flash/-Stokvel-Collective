import { beforeEach, describe, expect, it, vi } from 'vitest';

const { tx, prismaMock } = vi.hoisted(() => {
  const tx = {
    buyingPool: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    order: {
      create: vi.fn(),
    },
  };
  const prismaMock = {
    buyingPool: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    order: {
      create: vi.fn(),
    },
    $transaction: vi.fn(async (cb: (client: typeof tx) => Promise<unknown>) => cb(tx)),
  };
  return { tx, prismaMock };
});

vi.mock('@stokvel/database', () => ({
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
  prisma: prismaMock,
}));

import { PoolService } from '../pool.service';

function openPool(overrides: Record<string, unknown> = {}) {
  return {
    id: 'pool-1',
    status: 'OPEN',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    currentQuantity: 35,
    currentAmount: '3149.65',
    targetQuantity: 100,
    hubId: 'hub-1',
    product: { unitPrice: '89.99' },
    ...overrides,
  };
}

describe('PoolService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (cb: (client: typeof tx) => Promise<unknown>) => cb(tx));
    tx.buyingPool.update.mockResolvedValue({});
    tx.order.create.mockResolvedValue({ id: 'order-1' });
  });

  it('lists pools and loads one pool by id', async () => {
    prismaMock.buyingPool.findMany.mockResolvedValue([{ id: 'pool-1' }]);
    prismaMock.buyingPool.findUnique.mockResolvedValue({ id: 'pool-1' });

    await expect(PoolService.listPools()).resolves.toEqual([{ id: 'pool-1' }]);
    await expect(PoolService.getPoolById('pool-1')).resolves.toEqual({ id: 'pool-1' });
  });

  it('throws when the pool does not exist', async () => {
    prismaMock.buyingPool.findUnique.mockResolvedValue(null);
    await expect(PoolService.getPoolById('missing')).rejects.toThrow('Buying pool not found');
  });

  it('rejects an order when the pool is missing or not open', async () => {
    tx.buyingPool.findUnique.mockResolvedValue(null);
    await expect(PoolService.placeOrder('user-1', 'missing', 2)).rejects.toThrow(
      'Buying pool is not active or available',
    );

    tx.buyingPool.findUnique.mockResolvedValue(openPool({ status: 'LOCKED' }));
    await expect(PoolService.placeOrder('user-1', 'pool-1', 2)).rejects.toThrow(
      'Buying pool is not active or available',
    );
    expect(tx.order.create).not.toHaveBeenCalled();
  });

  it('rejects an order after the pool expires', async () => {
    tx.buyingPool.findUnique.mockResolvedValue(openPool({ expiresAt: new Date(Date.now() - 1000) }));

    await expect(PoolService.placeOrder('user-1', 'pool-1', 1)).rejects.toThrow(
      'Buying pool period has expired',
    );
    expect(tx.buyingPool.update).not.toHaveBeenCalled();
  });

  it('rejects a non-positive quantity before taking payment', async () => {
    await expect(PoolService.placeOrder('user-1', 'pool-1', 0)).rejects.toThrow(
      'Quantity must be a positive whole number',
    );
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('holds the contribution in escrow and keeps the pool open below target', async () => {
    tx.buyingPool.findUnique.mockResolvedValue(openPool());

    await PoolService.placeOrder('user-1', 'pool-1', 2);

    expect(tx.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          poolId: 'pool-1',
          hubId: 'hub-1',
          quantity: 2,
          totalAmount: 179.98,
          status: 'PAID',
          collectionOtp: expect.stringMatching(/^\d{6}$/),
          escrow: {
            create: expect.objectContaining({
              amount: 179.98,
              status: 'HELD_IN_ESCROW',
              providerRef: expect.stringMatching(/^SIM_PAY_\d+$/),
            }),
          },
        }),
      }),
    );
    expect(tx.buyingPool.update).toHaveBeenCalledWith({
      where: { id: 'pool-1' },
      data: {
        currentQuantity: 37,
        currentAmount: 3329.63,
        status: 'OPEN',
      },
    });
  });

  it('locks the pool once a contribution reaches the wholesale target', async () => {
    tx.buyingPool.findUnique.mockResolvedValue(
      openPool({ currentQuantity: 98, currentAmount: '8820.00', targetQuantity: 100 }),
    );

    await PoolService.placeOrder('user-1', 'pool-1', 2);

    expect(tx.buyingPool.update).toHaveBeenCalledWith({
      where: { id: 'pool-1' },
      data: {
        currentQuantity: 100,
        currentAmount: 8999.98,
        status: 'LOCKED',
      },
    });
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { tx, prismaMock } = vi.hoisted(() => {
  const tx = {
    escrowTransaction: { update: vi.fn() },
    order: { update: vi.fn() },
  };
  const prismaMock = {
    order: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(async (cb: (client: typeof tx) => Promise<unknown>) => cb(tx)),
  };
  return { tx, prismaMock };
});

vi.mock('@stokvel/database', () => ({
  OrderStatus: {
    PAID: 'PAID',
    COLLECTED: 'COLLECTED',
    CANCELLED: 'CANCELLED',
  },
  PaymentStatus: {
    HELD_IN_ESCROW: 'HELD_IN_ESCROW',
    DISBURSED: 'DISBURSED',
    REFUNDED: 'REFUNDED',
  },
  prisma: prismaMock,
}));

import { FulfillmentService } from '../fulfillment.service';

function paidOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: 'order-1',
    status: 'PAID',
    hub: { managerId: 'manager-1' },
    escrow: { id: 'escrow-1' },
    ...overrides,
  };
}

describe('FulfillmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (cb: (client: typeof tx) => Promise<unknown>) => cb(tx));
    tx.escrowTransaction.update.mockResolvedValue({});
    tx.order.update.mockResolvedValue({ id: 'order-1', status: 'COLLECTED' });
  });

  it('rejects an unknown or ineligible collection code', async () => {
    prismaMock.order.findFirst.mockResolvedValue(null);

    await expect(FulfillmentService.verifyAndRedeemCode('manager-1', '000000')).rejects.toThrow(
      'Invalid collection code or order not eligible for redemption',
    );
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('rejects a code presented at the wrong hub', async () => {
    prismaMock.order.findFirst.mockResolvedValue(paidOrder());

    await expect(FulfillmentService.verifyAndRedeemCode('manager-2', '849204')).rejects.toThrow(
      'Unauthorized: Code must be redeemed at designated manager hub',
    );
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('normalizes a spaced voucher, disburses escrow, and marks the order collected', async () => {
    prismaMock.order.findFirst.mockResolvedValue(paidOrder());

    const updated = await FulfillmentService.verifyAndRedeemCode('manager-1', '849 204');

    expect(prismaMock.order.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { collectionOtp: '849204', status: 'PAID' },
      }),
    );
    expect(tx.escrowTransaction.update).toHaveBeenCalledWith({
      where: { id: 'escrow-1' },
      data: { status: 'DISBURSED' },
    });
    expect(tx.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'order-1' },
        data: { status: 'COLLECTED' },
      }),
    );
    expect(updated).toEqual({ id: 'order-1', status: 'COLLECTED' });
  });

  it('collects an order that has no escrow row without disbursing', async () => {
    prismaMock.order.findFirst.mockResolvedValue(paidOrder({ escrow: null }));

    await FulfillmentService.verifyAndRedeemCode('manager-1', '849204');

    expect(tx.escrowTransaction.update).not.toHaveBeenCalled();
    expect(tx.order.update).toHaveBeenCalledOnce();
  });

  it('allows the demo redemption path when no hub manager id is supplied', async () => {
    prismaMock.order.findFirst.mockResolvedValue(paidOrder());

    await FulfillmentService.verifyAndRedeemCode('', '849204');

    expect(tx.order.update).toHaveBeenCalledOnce();
  });

  it('returns a voucher and throws when the order is missing', async () => {
    prismaMock.order.findUnique.mockResolvedValueOnce({ id: 'order-1' });
    await expect(FulfillmentService.getOrderByVoucher('order-1')).resolves.toEqual({ id: 'order-1' });

    prismaMock.order.findUnique.mockResolvedValueOnce(null);
    await expect(FulfillmentService.getOrderByVoucher('missing')).rejects.toThrow('Voucher order not found');
  });
});

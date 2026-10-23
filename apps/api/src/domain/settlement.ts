export interface EscrowRef {
  id: string;
}

export interface SettleableOrder {
  id: string;
  escrow: EscrowRef | null;
}

export interface SettleablePool {
  id: string;
  currentQuantity: number;
  targetQuantity: number;
  orders: SettleableOrder[];
}

export type ExpiredPoolDecision = 'refund' | 'lock';

export function expiredPoolDecision(
  pool: Pick<SettleablePool, 'currentQuantity' | 'targetQuantity'>,
): ExpiredPoolDecision {
  return pool.currentQuantity < pool.targetQuantity ? 'refund' : 'lock';
}

interface StatusUpdate {
  where: { id: string };
  data: { status: string };
}

export interface SettlementWriter {
  buyingPool: {
    update(args: StatusUpdate): Promise<unknown>;
  };
  order: {
    update(args: StatusUpdate): Promise<unknown>;
  };
  escrowTransaction: {
    update(args: StatusUpdate): Promise<unknown>;
  };
}

export async function refundUnmetPool(
  pool: Pick<SettleablePool, 'id' | 'orders'>,
  tx: SettlementWriter,
): Promise<void> {
  await tx.buyingPool.update({
    where: { id: pool.id },
    data: { status: 'CANCELLED' },
  });

  for (const order of pool.orders) {
    await tx.order.update({
      where: { id: order.id },
      data: { status: 'CANCELLED' },
    });

    if (order.escrow) {
      await tx.escrowTransaction.update({
        where: { id: order.escrow.id },
        data: { status: 'REFUNDED' },
      });
    }
  }
}

export async function lockFulfilledPool(
  poolId: string,
  db: Pick<SettlementWriter, 'buyingPool'>,
): Promise<void> {
  await db.buyingPool.update({
    where: { id: poolId },
    data: { status: 'LOCKED' },
  });
}

import { prisma, PoolStatus, OrderStatus, PaymentStatus } from '@stokvel/database';
import {
  assertContributionQuantity,
  contributionAmount,
  isPoolExpired,
  nextPoolTotals,
  statusAfterContribution,
} from '../../domain/ledger';

export class PoolService {
  static async listPools() {
    return await prisma.buyingPool.findMany({
      include: {
        product: true,
        hub: true,
        group: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getPoolById(id: string) {
    const pool = await prisma.buyingPool.findUnique({
      where: { id },
      include: {
        product: true,
        hub: true,
        group: true,
      },
    });

    if (!pool) {
      throw new Error('Buying pool not found');
    }

    return pool;
  }

  static async placeOrder(userId: string, poolId: string, quantity: number) {
    assertContributionQuantity(quantity);
    return await prisma.$transaction(async (tx) => {
      const pool = await tx.buyingPool.findUnique({
        where: { id: poolId },
        include: { product: true },
      });

      if (!pool || pool.status !== PoolStatus.OPEN) {
        throw new Error('Buying pool is not active or available');
      }

      if (isPoolExpired(pool.expiresAt)) {
        throw new Error('Buying pool period has expired');
      }

      const itemCost = contributionAmount(pool.product.unitPrice, quantity);
      const { currentQuantity: updatedQuantity, currentAmount: updatedAmount } = nextPoolTotals(
        pool.currentQuantity,
        pool.currentAmount,
        quantity,
        itemCost,
      );

      const order = await tx.order.create({
        data: {
          userId,
          poolId,
          hubId: pool.hubId,
          quantity,
          totalAmount: itemCost,
          status: OrderStatus.PAID, // Simulated instant confirmation
          collectionOtp: Math.floor(100000 + Math.random() * 900000).toString(),
          escrow: {
            create: {
              amount: itemCost,
              status: PaymentStatus.HELD_IN_ESCROW,
              providerRef: `SIM_PAY_${Date.now()}`,
            },
          },
        },
        include: {
          escrow: true,
          pool: {
            include: {
              product: true,
            },
          },
          hub: true,
        },
      });

      const nextStatus = statusAfterContribution(updatedQuantity, pool.targetQuantity);
      await tx.buyingPool.update({
        where: { id: poolId },
        data: {
          currentQuantity: updatedQuantity,
          currentAmount: updatedAmount,
          status: nextStatus === 'LOCKED' ? PoolStatus.LOCKED : PoolStatus.OPEN,
        },
      });

      return order;
    });
  }
}

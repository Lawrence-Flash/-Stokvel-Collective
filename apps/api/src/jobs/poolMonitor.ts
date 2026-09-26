import { Queue, Worker } from 'bullmq';
import { prisma, PoolStatus, PaymentStatus, OrderStatus } from '@stokvel/database';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

export const poolQueue = new Queue('pool-lifecycle', {
  connection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export const poolWorker = new Worker(
  'pool-lifecycle',
  async (job) => {
    if (job.name === 'evaluate-expired-pools') {
      const expiredPools = await prisma.buyingPool.findMany({
        where: {
          status: PoolStatus.OPEN,
          expiresAt: { lte: new Date() },
        },
        include: { orders: { include: { escrow: true } } },
      });

      for (const pool of expiredPools) {
        if (pool.currentQuantity < pool.targetQuantity) {
          // Unmet threshold: Cancel pool and initiate refunds
          await prisma.$transaction(async (tx) => {
            await tx.buyingPool.update({
              where: { id: pool.id },
              data: { status: PoolStatus.CANCELLED },
            });

            for (const order of pool.orders) {
              await tx.order.update({
                where: { id: order.id },
                data: { status: OrderStatus.CANCELLED },
              });

              if (order.escrow) {
                await tx.escrowTransaction.update({
                  where: { id: order.escrow.id },
                  data: { status: PaymentStatus.REFUNDED },
                });
              }
            }
          });
          console.log(`Pool ${pool.id} cancelled. Refunds triggered.`);
        } else {
          // Threshold achieved: Lock pool for wholesale batch ordering
          await prisma.buyingPool.update({
            where: { id: pool.id },
            data: { status: PoolStatus.LOCKED },
          });
          console.log(`Pool ${pool.id} target reached upon expiry. Locked for fulfillment.`);
        }
      }
    }
  },
  { connection }
);

poolWorker.on('error', (err) => {
  console.warn('BullMQ PoolWorker warning:', err.message);
});

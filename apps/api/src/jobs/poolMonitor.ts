import { Queue, Worker } from 'bullmq';
import { prisma, PoolStatus } from '@stokvel/database';
import {
  expiredPoolDecision,
  lockFulfilledPool,
  refundUnmetPool,
  type SettlementWriter,
} from '../domain/settlement';

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
        if (expiredPoolDecision(pool) === 'refund') {
          await prisma.$transaction(async (tx) => {
            await refundUnmetPool(pool, tx as unknown as SettlementWriter);
          });
          console.log(`Pool ${pool.id} cancelled. Refunds triggered.`);
        } else {
          await lockFulfilledPool(pool.id, prisma as unknown as SettlementWriter);
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

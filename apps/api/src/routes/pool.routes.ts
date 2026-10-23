import { Router } from 'express';
import { PoolService } from '../modules/pool/pool.service';
import { validate, orderPayloadSchema } from '../middleware/validation';
import { apiLimiter } from '../middleware/rateLimit';
import { prisma } from '@stokvel/database';

const router = Router();

router.use(apiLimiter);

// List all pools
router.get('/pools', async (_req, res) => {
  try {
    const pools = await PoolService.listPools();
    return res.json(pools);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Get specific pool
router.get('/pools/:id', async (req, res) => {
  try {
    const pool = await PoolService.getPoolById(req.params.id);
    return res.json(pool);
  } catch (err: any) {
    return res.status(404).json({ error: err.message });
  }
});

// Place order within a buying pool
router.post(
  '/orders',
  validate(orderPayloadSchema),
  async (req, res) => {
    try {
      const { poolId, quantity } = req.body;
      let userId = req.body.userId;

      if (!userId) {
        // Retrieve or create a default demo user if not authenticated
        const defaultUser = await prisma.user.findFirst({
          where: { role: 'MEMBER' },
        });
        if (defaultUser) {
          userId = defaultUser.id;
        } else {
          const newUser = await prisma.user.create({
            data: {
              phoneNumber: '+27820000002',
              fullName: 'Nomvula Dlamini',
              role: 'MEMBER',
            },
          });
          userId = newUser.id;
        }
      }

      const order = await PoolService.placeOrder(userId, poolId, quantity);
      return res.status(201).json(order);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Order failed' });
    }
  }
);

// Get specific order / voucher details
router.get('/orders/:id', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        pool: { include: { product: true } },
        hub: true,
        escrow: true,
        user: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.json(order);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;

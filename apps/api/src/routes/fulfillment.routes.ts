import { Router } from 'express';
import { FulfillmentService } from '../modules/fulfillment/fulfillment.service';
import { validate, redeemPayloadSchema } from '../middleware/validation';
import { prisma } from '@stokvel/database';

const router = Router();

// Redeem collection voucher OTP
router.post(
  '/fulfillment/redeem',
  validate(redeemPayloadSchema),
  async (req, res) => {
    try {
      const { collectionOtp } = req.body;
      let hubManagerId = req.body.hubManagerId;

      if (!hubManagerId) {
        // If not specified in demo, use the hub manager from database
        const manager = await prisma.user.findFirst({
          where: { role: 'HUB_MANAGER' },
        });
        hubManagerId = manager?.id || '';
      }

      const updatedOrder = await FulfillmentService.verifyAndRedeemCode(
        hubManagerId,
        collectionOtp
      );

      return res.json({
        message: 'Order successfully verified and marked as COLLECTED.',
        order: updatedOrder,
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Code verification failed or invalid' });
    }
  }
);

// Get voucher details by order ID
router.get('/fulfillment/voucher/:id', async (req, res) => {
  try {
    const order = await FulfillmentService.getOrderByVoucher(req.params.id);
    return res.json(order);
  } catch (err: any) {
    return res.status(404).json({ error: err.message });
  }
});

export default router;

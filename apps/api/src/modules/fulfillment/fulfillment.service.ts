import { prisma, OrderStatus, PaymentStatus } from '@stokvel/database';
import { isAuthorizedToRedeem, normalizeCollectionCode } from '../../domain/fulfillment';

export class FulfillmentService {
  static async verifyAndRedeemCode(hubManagerId: string, collectionOtp: string) {
    const cleanOtp = normalizeCollectionCode(collectionOtp);

    const order = await prisma.order.findFirst({
      where: {
        collectionOtp: cleanOtp,
        status: OrderStatus.PAID,
      },
      include: {
        hub: true,
        escrow: true,
        pool: { include: { product: true } },
        user: true,
      },
    });

    if (!order) {
      throw new Error('Invalid collection code or order not eligible for redemption');
    }

    if (!isAuthorizedToRedeem(hubManagerId, order.hub.managerId)) {
      throw new Error('Unauthorized: Code must be redeemed at designated manager hub');
    }

    return await prisma.$transaction(async (tx) => {
      if (order.escrow) {
        await tx.escrowTransaction.update({
          where: { id: order.escrow.id },
          data: { status: PaymentStatus.DISBURSED },
        });
      }

      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.COLLECTED },
        include: {
          escrow: true,
          pool: { include: { product: true } },
          user: true,
        },
      });

      return updatedOrder;
    });
  }

  static async getOrderByVoucher(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        pool: { include: { product: true } },
        hub: true,
        user: true,
      },
    });
    if (!order) {
      throw new Error('Voucher order not found');
    }
    return order;
  }
}

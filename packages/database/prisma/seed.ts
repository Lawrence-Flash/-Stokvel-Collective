import { PrismaClient, Role, PoolStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "User", "StokvelGroup", "PickupHub", "Product", "BuyingPool", "Order", "EscrowTransaction" CASCADE;`);

  const manager = await prisma.user.create({
    data: {
      phoneNumber: '+27820000001',
      fullName: 'Sipho Zulu',
      role: Role.HUB_MANAGER,
    },
  });

  const member = await prisma.user.create({
    data: {
      phoneNumber: '+27820000002',
      fullName: 'Nomvula Dlamini',
      role: Role.MEMBER,
    },
  });

  const hub = await prisma.pickupHub.create({
    data: {
      name: 'Soweto Central Hub',
      address: '7482 Vilakazi St, Orlando West',
      city: 'Johannesburg',
      managerId: manager.id,
    },
  });

  const group = await prisma.stokvelGroup.create({
    data: {
      name: 'Orlando East Buying Club',
      code: 'ORL-EAST-01',
      members: {
        create: { userId: member.id },
      },
    },
  });

  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Ace Super Maize Meal',
        description: '10kg Premium Quality Maize Meal',
        unitPrice: 89.99,
        retailPrice: 119.99,
        unitQuantity: '10kg',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Sunfoil Sunflower Oil',
        description: '5L Pure Sunflower Cooking Oil',
        unitPrice: 145.00,
        retailPrice: 189.99,
        unitQuantity: '5L',
      },
    }),
  ]);

  await prisma.buyingPool.create({
    data: {
      productId: products[0].id,
      hubId: hub.id,
      groupId: group.id,
      status: PoolStatus.OPEN,
      targetQuantity: 100,
      currentQuantity: 35,
      targetAmount: 8999.00,
      currentAmount: 3149.65,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.buyingPool.create({
    data: {
      productId: products[1].id,
      hubId: hub.id,
      groupId: group.id,
      status: PoolStatus.OPEN,
      targetQuantity: 50,
      currentQuantity: 28,
      targetAmount: 7250.00,
      currentAmount: 4060.00,
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('Seed executed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

/**
 * @openapi
 * /api/super-admin/seed-plans:
 *   post:
 *     summary: Seed default subscription plans
 *     description: Populates the database with initial subscription plans required for gym creation. Restricted to SUPER_ADMIN.
 *     tags: [Super Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Plans seeded successfully
 */
import { NextRequest } from 'next/server';
import { withRole } from '@/api/middleware/auth';
import prisma from '@/api/db/client';
import { success, serverError } from '@/api/utils/response';

export const POST = withRole(['SUPER_ADMIN'], async (req: NextRequest) => {
  try {
    const plans = [
      {
        name: 'Basic Plan',
        price: 49.99,
        maxBranches: 1,
        maxTrainers: 5,
        maxMembers: 100,
        billingCycle: 'monthly',
      },
      {
        name: 'Premium Plan',
        price: 99.99,
        maxBranches: 3,
        maxTrainers: 15,
        maxMembers: 500,
        billingCycle: 'monthly',
      },
      {
        name: 'Enterprise Plan',
        price: 199.99,
        maxBranches: 10,
        maxTrainers: 50,
        maxMembers: 2000,
        billingCycle: 'monthly',
      },
    ];

    // Create plans if they don't exist
    const createdPlans = await Promise.all(
      plans.map((plan) =>
        prisma.subscriptionPlan.upsert({
          where: { id: '00000000-0000-0000-0000-000000000000' }, // Dummy check to use upsert for first time
          update: {},
          create: plan,
        }).catch(() => prisma.subscriptionPlan.create({ data: plan }))
      )
    );

    return success(createdPlans, "Default subscription plans seeded successfully");
  } catch (error: any) {
    return serverError(error);
  }
});

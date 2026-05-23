import { NextRequest } from 'next/server';
import { withAuth } from '@/api/middleware/auth';
import { sendResponse, sendError } from '@/api/utils/response';
import prisma from '@/api/db/client';

export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    const gymId = user.gymId;

    if (!gymId) {
      return sendResponse({
        totalMembers: 0,
        totalTrainers: 0,
        activePlans: 0,
        monthlyRevenue: 0,
      });
    }

    // 1. Total Members
    const totalMembers = await prisma.member.count({
      where: {
        user: { gymId }
      }
    });

    // 2. Total Trainers
    const totalTrainers = await prisma.trainer.count({
      where: {
        user: { gymId }
      }
    });

    // 3. Active Memberships
    const activePlans = await prisma.memberMembership.count({
      where: {
        status: 'ACTIVE',
        member: {
          user: { gymId }
        }
      }
    });

    // 4. Monthly Revenue (sum of successful payments in current month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const payments = await prisma.payment.findMany({
      where: {
        paymentStatus: 'SUCCESS',
        paidAt: {
          gte: startOfMonth
        },
        member: {
          user: { gymId }
        }
      },
      select: {
        amount: true
      }
    });

    const monthlyRevenue = payments.reduce((acc, curr) => acc + Number(curr.amount), 0);

    return sendResponse({
      totalMembers,
      totalTrainers,
      activePlans,
      monthlyRevenue,
    });
  } catch (error: any) {
    return sendError(error);
  }
});

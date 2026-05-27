import { NextRequest } from 'next/server';
import { withAuth } from '@/api/middleware/auth';
import { sendResponse, sendError } from '@/api/utils/response';
import prisma from '@/api/db/client';

export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    const gymId = user.gymId;
    if (!gymId) return sendResponse([]);

    const payments = await prisma.payment.findMany({
      where: {
        member: {
          user: { gymId }
        }
      },
      include: {
        member: {
          include: {
            user: {
              include: {
                profile: true
              }
            }
          }
        },
        membership: {
          include: {
            membershipPlan: true
          }
        }
      },
      orderBy: {
        paidAt: 'desc'
      }
    });

    return sendResponse(payments);
  } catch (error: any) {
    return sendError(error);
  }
});

export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const gymId = user.gymId;
    if (!gymId) {
      throw new Error('Not authorized to log payments (no gym association)');
    }

    const body = await req.json();
    const { memberId, amount, paymentMethod, membershipPlanId } = body;

    // Find the member
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
          orderBy: { endDate: 'desc' }
        }
      }
    });

    if (!member) {
      return sendError('Member not found', 404);
    }

    let membershipId = member.memberships[0]?.id;

    // If no active membership, but membershipPlanId is supplied, create a new membership
    if (!membershipId && membershipPlanId) {
      const plan = await prisma.membershipPlan.findUnique({
        where: { id: membershipPlanId }
      });
      if (plan) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + plan.durationDays);

        const membership = await prisma.memberMembership.create({
          data: {
            memberId: member.id,
            membershipPlanId: plan.id,
            startDate,
            endDate,
            status: 'ACTIVE',
          }
        });
        membershipId = membership.id;
      }
    }

    if (!membershipId) {
      return sendError('Member has no active membership and no plan was provided', 400);
    }

    const payment = await prisma.payment.create({
      data: {
        memberId: member.id,
        membershipId,
        amount: Number(amount),
        paymentMethod,
        paymentStatus: 'SUCCESS',
        paidAt: new Date(),
        transactionId: `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      }
    });

    return sendResponse(payment, 201, 'Payment logged successfully');
  } catch (error: any) {
    return sendError(error);
  }
});

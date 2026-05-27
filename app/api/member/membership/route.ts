import { NextRequest } from 'next/server';
import { withRole } from '@/api/middleware/auth';
import prisma from '@/api/db/client';
import { success, serverError, forbidden, notifyNotFound } from '@/api/utils/response';

// GET: Current and past memberships of the member
export const GET = withRole(['MEMBER'], async (req: NextRequest, user: any) => {
  try {
    const { userId } = user;

    // Verify member is active
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { status: true }
    });
    if (!dbUser || dbUser.status !== 'ACTIVE') {
      return forbidden("Member account is inactive");
    }

    // Fetch member
    const member = await prisma.member.findUnique({
      where: { userId }
    });

    if (!member) {
      return notifyNotFound("Member profile not found");
    }

    // Fetch memberships list (no payment/pricing modifications exposed)
    const memberships = await prisma.memberMembership.findMany({
      where: {
        memberId: member.id
      },
      include: {
        membershipPlan: {
          select: {
            name: true,
            durationDays: true,
            description: true,
            price: true
          }
        }
      },
      orderBy: {
        endDate: 'desc'
      }
    });

    return success(memberships);
  } catch (error: any) {
    return serverError(error);
  }
});

import { NextRequest } from 'next/server';
import { withAuth } from '@/api/middleware/auth';
import { sendResponse, sendError } from '@/api/utils/response';
import prisma from '@/api/db/client';

export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    const gymId = user.gymId;
    if (!gymId) return sendResponse([]);

    const plans = await prisma.membershipPlan.findMany({
      where: { gymId, status: 'ACTIVE' }
    });

    return sendResponse(plans);
  } catch (error: any) {
    return sendError(error);
  }
});

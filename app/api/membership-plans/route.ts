import { NextRequest } from 'next/server';
import { withAuth } from '@/api/middleware/auth';
import { sendResponse, sendError } from '@/api/utils/response';
import prisma from '@/api/db/client';

export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    let gymId = user.gymId;

    if (isSuperAdmin) {
      const urlGymId = req.nextUrl.searchParams.get('gymId');
      if (urlGymId) {
        gymId = urlGymId;
      }
    }

    if (!gymId && !isSuperAdmin) return sendResponse([]);

    const plans = await prisma.membershipPlan.findMany({
      where: gymId ? { gymId, status: 'ACTIVE' } : { status: 'ACTIVE' }
    });

    return sendResponse(plans);
  } catch (error: any) {
    return sendError(error);
  }
});

import { NextRequest } from 'next/server';
import { withRole } from '@/api/middleware/auth';
import prisma from '@/api/db/client';
import { success, serverError } from '@/api/utils/response';

// GET: Super Admin retrieves all subscription plans
export const GET = withRole(['SUPER_ADMIN'], async (req: NextRequest) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { price: 'asc' }
    });
    return success(plans);
  } catch (error: any) {
    return serverError(error);
  }
});

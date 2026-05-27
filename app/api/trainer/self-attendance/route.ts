import { NextRequest } from 'next/server';
import { withRole } from '@/api/middleware/auth';
import prisma from '@/api/db/client';
import { success, serverError } from '@/api/utils/response';

export const GET = withRole(['TRAINER'], async (req: NextRequest, user: any) => {
  try {
    const { userId } = user;

    const latestLog = await prisma.auditLog.findFirst({
      where: {
        userId,
        action: { in: ['TRAINER_CHECK_IN', 'TRAINER_CHECK_OUT'] }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const isCurrentlyCheckedIn = latestLog?.action === 'TRAINER_CHECK_IN';

    return success({
      checkedIn: isCurrentlyCheckedIn,
      lastAction: latestLog
    });
  } catch (error: any) {
    return serverError(error);
  }
});

export const POST = withRole(['TRAINER'], async (req: NextRequest, user: any) => {
  try {
    const { userId } = user;

    const latestLog = await prisma.auditLog.findFirst({
      where: {
        userId,
        action: { in: ['TRAINER_CHECK_IN', 'TRAINER_CHECK_OUT'] }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const isCurrentlyCheckedIn = latestLog?.action === 'TRAINER_CHECK_IN';
    const nextAction = isCurrentlyCheckedIn ? 'TRAINER_CHECK_OUT' : 'TRAINER_CHECK_IN';

    const newLog = await prisma.auditLog.create({
      data: {
        userId,
        action: nextAction,
        entity: 'Trainer',
        metadata: {
          timestamp: new Date().toISOString()
        }
      }
    });

    return success({
      checkedIn: nextAction === 'TRAINER_CHECK_IN',
      log: newLog
    }, `Trainer checked ${nextAction === 'TRAINER_CHECK_IN' ? 'in' : 'out'} successfully`);
  } catch (error: any) {
    return serverError(error);
  }
});

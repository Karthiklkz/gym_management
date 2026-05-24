import { NextRequest } from 'next/server';
import { withRole } from '@/api/middleware/auth';
import prisma from '@/api/db/client';
import { success, serverError, forbidden, notifyNotFound, badRequest } from '@/api/utils/response';

// GET: Fetch trainer's own notifications
export const GET = withRole(['TRAINER'], async (req: NextRequest, user: any) => {
  try {
    const { userId } = user;

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { status: true }
    });
    if (!dbUser || dbUser.status !== 'ACTIVE') {
      return forbidden("Trainer account is inactive");
    }

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    const [notifications, total] = await prisma.$transaction([
      prisma.notification.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.notification.count({ where: { userId } })
    ]);

    return success({
      notifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    return serverError(error);
  }
});

// PUT: Mark a specific notification or all notifications as read
export const PUT = withRole(['TRAINER'], async (req: NextRequest, user: any) => {
  try {
    const { userId } = user;

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { status: true }
    });
    if (!dbUser || dbUser.status !== 'ACTIVE') {
      return forbidden("Trainer account is inactive");
    }

    const body = await req.json();
    const { id, all } = body;

    if (all) {
      // Mark all read
      await prisma.$transaction(async (tx) => {
        await tx.notification.updateMany({
          where: { userId, isRead: false },
          data: { isRead: true }
        });

        // Write Audit Log
        await tx.auditLog.create({
          data: {
            userId,
            action: 'MARK_ALL_NOTIFICATIONS_READ',
            entity: 'Notification',
            metadata: { count: 'all' }
          }
        });
      });

      return success(null, "All notifications marked as read");
    }

    if (!id) {
      return badRequest("Notification ID or 'all' flag is required");
    }

    // Verify ownership
    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification || notification.userId !== userId) {
      return notifyNotFound("Notification not found or access denied");
    }

    // Mark single notification read
    const updatedNotification = await prisma.$transaction(async (tx) => {
      const record = await tx.notification.update({
        where: { id },
        data: { isRead: true }
      });

      // Write Audit Log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'MARK_NOTIFICATION_READ',
          entity: 'Notification',
          entityId: id
        }
      });

      return record;
    });

    return success(updatedNotification, "Notification marked as read");
  } catch (error: any) {
    return serverError(error);
  }
});

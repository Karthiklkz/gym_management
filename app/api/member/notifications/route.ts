import { NextRequest } from 'next/server';
import { withRole } from '@/api/middleware/auth';
import prisma from '@/api/db/client';
import { success, serverError, forbidden, notifyNotFound, badRequest } from '@/api/utils/response';

// GET: Paginated list of member's own notifications
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

    // Parse Query Params
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;

    const [notifications, total] = await prisma.$transaction([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.notification.count({ where: { userId } })
    ]);

    const totalPages = Math.ceil(total / limit);

    return success({
      notifications,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    });
  } catch (error: any) {
    return serverError(error);
  }
});

// PUT: Mark notification(s) as read with ownership validation
export const PUT = withRole(['MEMBER'], async (req: NextRequest, user: any) => {
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

    const body = await req.json();
    const { id, all } = body;

    if (all) {
      // Mark all read for this user
      await prisma.$transaction(async (tx) => {
        await tx.notification.updateMany({
          where: { userId, isRead: false },
          data: { isRead: true }
        });

        // Write Audit Log
        await tx.auditLog.create({
          data: {
            userId,
            action: 'MEMBER_READ_ALL_NOTIFICATIONS',
            entity: 'Notification',
            metadata: { all: true }
          }
        });
      });

      return success(null, "All notifications marked as read");
    }

    if (!id) {
      return badRequest("Notification ID is required");
    }

    // Verify ownership of the notification
    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification || notification.userId !== userId) {
      return notifyNotFound("Notification not found");
    }

    // Mark single notification read in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.notification.update({
        where: { id },
        data: { isRead: true }
      });

      // Write Audit Log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'MEMBER_READ_NOTIFICATION',
          entity: 'Notification',
          entityId: id,
          metadata: { notificationId: id }
        }
      });
    });

    return success(null, "Notification marked as read");
  } catch (error: any) {
    return serverError(error);
  }
});

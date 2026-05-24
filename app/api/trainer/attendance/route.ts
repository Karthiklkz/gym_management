import { NextRequest } from 'next/server';
import { withRole } from '@/api/middleware/auth';
import prisma from '@/api/db/client';
import { success, serverError, forbidden, badRequest } from '@/api/utils/response';

// GET: View branch attendance with date/member filters
export const GET = withRole(['TRAINER'], async (req: NextRequest, user: any) => {
  try {
    const { userId, gymId, branchId } = user;

    if (!gymId || !branchId) {
      return forbidden("Trainer is not assigned to a gym and branch");
    }

    // Verify trainer is active
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { status: true }
    });
    if (!dbUser || dbUser.status !== 'ACTIVE') {
      return forbidden("Trainer account is inactive");
    }

    const searchParams = req.nextUrl.searchParams;
    const dateStr = searchParams.get('date') || ''; // YYYY-MM-DD
    const memberId = searchParams.get('memberId') || '';

    const where: any = {
      branchId
    };

    if (dateStr) {
      const startOfDay = new Date(dateStr);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateStr);
      endOfDay.setHours(23, 59, 59, 999);

      where.checkIn = {
        gte: startOfDay,
        lte: endOfDay
      };
    }

    if (memberId) {
      where.memberId = memberId;
    }

    const attendanceRecords = await prisma.attendance.findMany({
      where,
      include: {
        member: {
          include: {
            user: {
              include: {
                profile: true
              }
            }
          }
        }
      },
      orderBy: {
        checkIn: 'desc'
      }
    });

    return success(attendanceRecords);
  } catch (error: any) {
    return serverError(error);
  }
});

// POST: Check in a member at the trainer's branch
export const POST = withRole(['TRAINER'], async (req: NextRequest, user: any) => {
  try {
    const { userId, gymId, branchId } = user;

    if (!gymId || !branchId) {
      return forbidden("Trainer is not assigned to a gym and branch");
    }

    // Verify trainer is active
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { status: true }
    });
    if (!dbUser || dbUser.status !== 'ACTIVE') {
      return forbidden("Trainer account is inactive");
    }

    const body = await req.json();
    const { memberId } = body;

    if (!memberId) {
      return badRequest("Member ID is required");
    }

    // Verify member belongs to trainer's branch
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: {
        user: true
      }
    });

    if (!member || member.user.gymId !== gymId || member.user.branchId !== branchId) {
      return forbidden("Member does not belong to your gym branch");
    }

    // Check if member is already checked in (active session with checkOut = null)
    const activeSession = await prisma.attendance.findFirst({
      where: {
        memberId,
        branchId,
        checkOut: null
      }
    });

    if (activeSession) {
      return badRequest("Member is already checked in");
    }

    // Perform check-in and log audit in a transaction
    const newAttendance = await prisma.$transaction(async (tx) => {
      const attendance = await tx.attendance.create({
        data: {
          memberId,
          branchId,
          checkIn: new Date()
        },
        include: {
          member: {
            include: {
              user: {
                include: { profile: true }
              }
            }
          }
        }
      });

      // Write Audit Log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'MEMBER_CHECK_IN',
          entity: 'Attendance',
          entityId: attendance.id,
          metadata: { memberId }
        }
      });

      return attendance;
    });

    return success(newAttendance, "Member checked in successfully");
  } catch (error: any) {
    return serverError(error);
  }
});

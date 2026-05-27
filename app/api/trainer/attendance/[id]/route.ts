import { NextRequest } from 'next/server';
import { withRole } from '@/api/middleware/auth';
import prisma from '@/api/db/client';
import { success, serverError, forbidden, notifyNotFound, badRequest } from '@/api/utils/response';

// PUT: Check out a member by attendance ID
export const PUT = withRole(['TRAINER'], async (req: NextRequest, user: any, { params }: { params: { id: string } }) => {
  try {
    const { userId, gymId, branchId } = user;
    const { id } = params;

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

    // Fetch attendance record and verify scoping
    const attendance = await prisma.attendance.findUnique({
      where: { id }
    });

    if (!attendance || attendance.branchId !== branchId) {
      return notifyNotFound("Attendance record not found in your branch");
    }

    if (attendance.checkOut) {
      return badRequest("Member has already been checked out");
    }

    // Perform check-out and log audit in a transaction
    const updatedAttendance = await prisma.$transaction(async (tx) => {
      const record = await tx.attendance.update({
        where: { id },
        data: {
          checkOut: new Date()
        }
      });

      // Write Audit Log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'MEMBER_CHECK_OUT',
          entity: 'Attendance',
          entityId: id,
          metadata: { memberId: record.memberId }
        }
      });

      return record;
    });

    return success(updatedAttendance, "Member checked out successfully");
  } catch (error: any) {
    return serverError(error);
  }
});

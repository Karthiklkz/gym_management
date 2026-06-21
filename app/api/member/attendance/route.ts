import { NextRequest } from 'next/server';
import { withRole } from '@/api/middleware/auth';
import prisma from '@/api/db/client';
import { success, serverError, forbidden, notifyNotFound, badRequest } from '@/api/utils/response';

// GET: Paginated list of member's own attendance records
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

    // Parse Query Params
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    const offset = (page - 1) * limit;

    // Build filters
    const where: any = {
      memberId: member.id
    };

    if (startDateStr || endDateStr) {
      where.checkIn = {};
      if (startDateStr) {
        where.checkIn.gte = new Date(startDateStr);
      }
      if (endDateStr) {
        const endOfFilterDate = new Date(endDateStr);
        endOfFilterDate.setHours(23, 59, 59, 999);
        where.checkIn.lte = endOfFilterDate;
      }
    }

    // Query DB in parallel
    const [attendanceList, total] = await prisma.$transaction([
      prisma.attendance.findMany({
        where,
        orderBy: {
          checkIn: 'desc'
        },
        skip: offset,
        take: limit
      }),
      prisma.attendance.count({ where })
    ]);

    // Format & Calculate Durations
    const formattedAttendance = attendanceList.map((record) => {
      let durationMinutes = null;
      if (record.checkIn && record.checkOut) {
        const diffMs = record.checkOut.getTime() - record.checkIn.getTime();
        durationMinutes = Math.round(diffMs / (1000 * 60)); // rounded to nearest minute
      }
      return {
        ...record,
        durationMinutes
      };
    });

    const totalPages = Math.ceil(total / limit);

    return success({
      attendance: formattedAttendance,
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

// POST: Self check-in / check-out toggle for members
export const POST = withRole(['MEMBER'], async (req: NextRequest, user: any) => {
  try {
    const { userId } = user;

    // Verify member is active
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { status: true, branchId: true }
    });
    if (!dbUser || dbUser.status !== 'ACTIVE') {
      return forbidden("Member account is inactive");
    }

    if (!dbUser.branchId) {
      return badRequest("Member is not assigned to a gym branch");
    }

    // Fetch member profile
    const member = await prisma.member.findUnique({
      where: { userId }
    });

    if (!member) {
      return notifyNotFound("Member profile not found");
    }

    // Check if member currently has an active check-in (checkOut is null)
    const activeSession = await prisma.attendance.findFirst({
      where: {
        memberId: member.id,
        branchId: dbUser.branchId,
        checkOut: null
      }
    });

    if (activeSession) {
      // Toggle: Perform Check-Out
      const updatedAttendance = await prisma.$transaction(async (tx) => {
        const record = await tx.attendance.update({
          where: { id: activeSession.id },
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
            entityId: activeSession.id,
            metadata: { memberId: member.id }
          }
        });

        return record;
      });

      return success({ checkedIn: false, session: updatedAttendance }, "Checked out successfully");
    } else {
      // Toggle: Perform Check-In
      const newAttendance = await prisma.$transaction(async (tx) => {
        const record = await tx.attendance.create({
          data: {
            memberId: member.id,
            branchId: dbUser.branchId as string,
            checkIn: new Date()
          }
        });

        // Write Audit Log
        await tx.auditLog.create({
          data: {
            userId,
            action: 'MEMBER_CHECK_IN',
            entity: 'Attendance',
            entityId: record.id,
            metadata: { memberId: member.id }
          }
        });

        return record;
      });

      return success({ checkedIn: true, session: newAttendance }, "Checked in successfully");
    }
  } catch (error: any) {
    return serverError(error);
  }
});

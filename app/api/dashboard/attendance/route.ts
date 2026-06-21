import { NextRequest } from 'next/server';
import { withRole } from '@/api/middleware/auth';
import { success, serverError, forbidden } from '@/api/utils/response';
import prisma from '@/api/db/client';

export const GET = withRole(['SUPER_ADMIN', 'GYM_ADMIN'], async (req: NextRequest, user: any) => {
  try {
    const { role, gymId } = user;
    const isSuperAdmin = role === 'SUPER_ADMIN';

    if (!isSuperAdmin && !gymId) {
      return forbidden("Admin is not associated with any gym network");
    }

    const { searchParams } = new URL(req.url);
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const branchId = searchParams.get('branchId');

    // 1. Build Date Filters
    const dateFilter: any = {};
    if (startDateStr) {
      dateFilter.gte = new Date(startDateStr);
    }
    if (endDateStr) {
      const endOfFilterDate = new Date(endDateStr);
      endOfFilterDate.setHours(23, 59, 59, 999);
      dateFilter.lte = endOfFilterDate;
    }

    // =====================================================
    // MEMBERS ATTENDANCE QUERY
    // =====================================================
    const memberWhere: any = {};

    if (!isSuperAdmin) {
      memberWhere.member = {
        user: { gymId }
      };
    }

    if (branchId) {
      memberWhere.branchId = branchId;
    }

    if (startDateStr || endDateStr) {
      memberWhere.checkIn = dateFilter;
    }

    const memberAttendanceList = await prisma.attendance.findMany({
      where: memberWhere,
      include: {
        member: {
          include: {
            user: {
              include: {
                profile: true,
                gym: { select: { name: true } }
              }
            }
          }
        },
        branch: { select: { name: true } }
      },
      orderBy: { checkIn: 'desc' }
    });

    const formattedMemberAttendance = memberAttendanceList.map((record) => {
      let durationMinutes = null;
      if (record.checkIn && record.checkOut) {
        const diffMs = record.checkOut.getTime() - record.checkIn.getTime();
        durationMinutes = Math.round(diffMs / (1000 * 60));
      }
      return {
        id: record.id,
        memberId: record.member.memberId,
        name: `${record.member.user.profile?.firstName} ${record.member.user.profile?.lastName || ""}`.trim(),
        email: record.member.user.email,
        branchName: record.branch.name,
        gymName: record.member.user.gym?.name || "N/A",
        checkIn: record.checkIn,
        checkOut: record.checkOut,
        durationMinutes
      };
    });

    // =====================================================
    // TRAINERS PRESENCE QUERY (VIA AUDITLOGS)
    // =====================================================
    const trainerLogWhere: any = {
      action: { in: ['TRAINER_CHECK_IN', 'TRAINER_CHECK_OUT'] }
    };

    if (!isSuperAdmin) {
      trainerLogWhere.user = { gymId };
    }

    if (branchId) {
      trainerLogWhere.user = { branchId };
    }

    if (startDateStr || endDateStr) {
      trainerLogWhere.createdAt = dateFilter;
    }

    // Get audit logs related to trainer attendance checkins
    const auditLogs = await prisma.auditLog.findMany({
      where: trainerLogWhere,
      include: {
        user: {
          include: {
            profile: true,
            gym: { select: { name: true } },
            branch: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'asc' } // chronological order to pair events
    });

    // Group logs by trainer user
    const logsByUser: Record<string, any[]> = {};
    auditLogs.forEach(log => {
      if (log.userId) {
        if (!logsByUser[log.userId]) {
          logsByUser[log.userId] = [];
        }
        logsByUser[log.userId].push(log);
      }
    });

    const trainerPresenceRecords: any[] = [];

    // Pair check-ins and check-outs to calculate presence times
    Object.keys(logsByUser).forEach(userId => {
      const userLogs = logsByUser[userId];
      let activeCheckIn: any = null;

      userLogs.forEach(log => {
        if (log.action === 'TRAINER_CHECK_IN') {
          // If we see a second check-in without check-out, push the previous one as an unclosed session first
          if (activeCheckIn) {
            trainerPresenceRecords.push({
              id: activeCheckIn.id,
              userId: activeCheckIn.userId,
              name: `${activeCheckIn.user?.profile?.firstName} ${activeCheckIn.user?.profile?.lastName || ""}`.trim(),
              email: activeCheckIn.user?.email || "N/A",
              branchName: activeCheckIn.user?.branch?.name || "N/A",
              gymName: activeCheckIn.user?.gym?.name || "N/A",
              checkIn: activeCheckIn.createdAt,
              checkOut: null,
              durationMinutes: null
            });
          }
          activeCheckIn = log;
        } else if (log.action === 'TRAINER_CHECK_OUT') {
          if (activeCheckIn) {
            const diffMs = log.createdAt.getTime() - activeCheckIn.createdAt.getTime();
            const durationMinutes = Math.round(diffMs / (1000 * 60));
            trainerPresenceRecords.push({
              id: `${activeCheckIn.id}-${log.id}`,
              userId: activeCheckIn.userId,
              name: `${activeCheckIn.user?.profile?.firstName} ${activeCheckIn.user?.profile?.lastName || ""}`.trim(),
              email: activeCheckIn.user?.email || "N/A",
              branchName: activeCheckIn.user?.branch?.name || "N/A",
              gymName: activeCheckIn.user?.gym?.name || "N/A",
              checkIn: activeCheckIn.createdAt,
              checkOut: log.createdAt,
              durationMinutes
            });
            activeCheckIn = null; // reset
          } else {
            // Check-out without check-in recorded in this window
            trainerPresenceRecords.push({
              id: log.id,
              userId: log.userId,
              name: `${log.user?.profile?.firstName} ${log.user?.profile?.lastName || ""}`.trim(),
              email: log.user?.email || "N/A",
              branchName: log.user?.branch?.name || "N/A",
              gymName: log.user?.gym?.name || "N/A",
              checkIn: null,
              checkOut: log.createdAt,
              durationMinutes: null
            });
          }
        }
      });

      // Remaining open check-in
      if (activeCheckIn) {
        trainerPresenceRecords.push({
          id: activeCheckIn.id,
          userId: activeCheckIn.userId,
          name: `${activeCheckIn.user?.profile?.firstName} ${activeCheckIn.user?.profile?.lastName || ""}`.trim(),
          email: activeCheckIn.user?.email || "N/A",
          branchName: activeCheckIn.user?.branch?.name || "N/A",
          gymName: activeCheckIn.user?.gym?.name || "N/A",
          checkIn: activeCheckIn.createdAt,
          checkOut: null,
          durationMinutes: null
        });
      }
    });

    // Order trainer records desc by check-in time
    trainerPresenceRecords.sort((a, b) => {
      const timeA = a.checkIn ? new Date(a.checkIn).getTime() : 0;
      const timeB = b.checkIn ? new Date(b.checkIn).getTime() : 0;
      return timeB - timeA;
    });

    // 4. Retrieve list of active branches for dropdown selections
    const branches = await prisma.branch.findMany({
      where: isSuperAdmin ? {} : { gymId },
      select: { id: true, name: true }
    });

    return success({
      members: formattedMemberAttendance,
      trainers: trainerPresenceRecords,
      branches
    });
  } catch (error: any) {
    return serverError(error);
  }
});

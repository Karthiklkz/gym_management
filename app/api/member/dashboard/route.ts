import { NextRequest } from 'next/server';
import { withRole } from '@/api/middleware/auth';
import prisma from '@/api/db/client';
import { success, serverError, forbidden, notifyNotFound } from '@/api/utils/response';

// GET: Member Dashboard Statistics
export const GET = withRole(['MEMBER'], async (req: NextRequest, user: any) => {
  try {
    const { userId } = user;

    // Verify member user status is active
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { status: true }
    });
    if (!dbUser || dbUser.status !== 'ACTIVE') {
      return forbidden("Member account is inactive");
    }

    // Fetch member record
    const member = await prisma.member.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                gender: true,
                dateOfBirth: true,
                profileImage: true,
                emergencyContact: true
              }
            }
          }
        }
      }
    });

    if (!member) {
      return notifyNotFound("Member profile not found");
    }

    // 1. Fetch Active Membership
    const activeMembership = await prisma.memberMembership.findFirst({
      where: {
        memberId: member.id,
        status: 'ACTIVE'
      },
      include: {
        membershipPlan: true
      }
    });

    let daysRemaining = 0;
    if (activeMembership) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endDate = new Date(activeMembership.endDate);
      const diffTime = endDate.getTime() - today.getTime();
      daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    // 2. Today's Attendance Check-in Status
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayAttendance = await prisma.attendance.findFirst({
      where: {
        memberId: member.id,
        checkIn: {
          gte: startOfToday,
          lte: endOfToday
        }
      }
    });

    const checkInStatus = todayAttendance 
      ? (todayAttendance.checkOut ? 'CHECKED_OUT' : 'CHECKED_IN') 
      : 'NOT_CHECKED_IN';

    // 3. Recent Attendance (Last 5 records)
    const recentAttendance = await prisma.attendance.findMany({
      where: {
        memberId: member.id
      },
      orderBy: {
        checkIn: 'desc'
      },
      take: 5
    });

    // 4. Unread Notification Count
    const unreadNotificationCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    });

    return success({
      profile: {
        userId: member.user.id,
        email: member.user.email,
        phone: member.user.phone,
        firstName: member.user.profile?.firstName || '',
        lastName: member.user.profile?.lastName || '',
        gender: member.user.profile?.gender || '',
        dateOfBirth: member.user.profile?.dateOfBirth || null,
        profileImage: member.user.profile?.profileImage || '',
        emergencyContact: member.user.profile?.emergencyContact || '',
        joinDate: member.joinDate
      },
      activeMembership: activeMembership ? {
        id: activeMembership.id,
        planName: activeMembership.membershipPlan.name,
        startDate: activeMembership.startDate,
        endDate: activeMembership.endDate,
        status: activeMembership.status,
        daysRemaining
      } : null,
      checkInStatus,
      todayAttendanceDetail: todayAttendance,
      recentAttendance,
      unreadNotificationCount
    });
  } catch (error: any) {
    return serverError(error);
  }
});

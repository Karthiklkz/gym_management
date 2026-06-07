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

    // 4. Fetch all attendance history for streaks calculation
    const allAttendance = await prisma.attendance.findMany({
      where: { memberId: member.id },
      select: { checkIn: true },
      orderBy: { checkIn: 'desc' }
    });

    let currentStreak = 0;
    let maxStreak = 0;
    const totalVisits = allAttendance.length;
    const weeklyChecklist = [false, false, false, false, false, false, false]; // Mon - Sun

    if (allAttendance.length > 0) {
      // Get unique date strings (YYYY-MM-DD) in local time
      const uniqueDates = Array.from(new Set(
        allAttendance.map(a => new Date(a.checkIn).toISOString().split('T')[0])
      )).sort((a, b) => b.localeCompare(a)); // sorted descending (newest first)

      const todayStr = new Date().toISOString().split('T')[0];
      const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      // Check if streak is active (has check-in today or yesterday)
      const hasCheckedInTodayOrYesterday = uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr;

      if (hasCheckedInTodayOrYesterday) {
        currentStreak = 1;
        let prevDate = new Date(uniqueDates[0]);

        for (let i = 1; i < uniqueDates.length; i++) {
          const currDate = new Date(uniqueDates[i]);
          const diffDays = Math.round((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            currentStreak++;
            prevDate = currDate;
          } else if (diffDays > 1) {
            break;
          }
        }
      }

      // Compute Max Streak
      let tempStreak = uniqueDates.length > 0 ? 1 : 0;
      maxStreak = tempStreak;
      for (let i = 1; i < uniqueDates.length; i++) {
        const prev = new Date(uniqueDates[i - 1]);
        const curr = new Date(uniqueDates[i]);
        const diffDays = Math.round((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
        if (tempStreak > maxStreak) {
          maxStreak = tempStreak;
        }
      }

      // Calculate Mon-Sun weekly check-in checklist
      const todayDate = new Date();
      const currentDayOfWeek = todayDate.getDay(); // 0 is Sunday, 1 is Monday...
      const daysToMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
      const startOfWeek = new Date(todayDate);
      startOfWeek.setDate(todayDate.getDate() - daysToMonday);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      allAttendance.forEach(a => {
        const checkInTime = new Date(a.checkIn);
        if (checkInTime >= startOfWeek && checkInTime <= endOfWeek) {
          let dayIndex = checkInTime.getDay() - 1; // 0 is Monday
          if (dayIndex === -1) dayIndex = 6; // Sunday is 6
          if (dayIndex >= 0 && dayIndex <= 6) {
            weeklyChecklist[dayIndex] = true;
          }
        }
      });
    }

    // 5. Unread Notification Count
    const unreadNotificationCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    });

    return success({
      profile: {
        userId: member.user.id,
        memberId: member.memberId,
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
      attendanceStreaks: {
        currentStreak,
        maxStreak,
        totalVisits,
        weeklyChecklist
      },
      unreadNotificationCount
    });
  } catch (error: any) {
    return serverError(error);
  }
});

import { NextRequest } from 'next/server';
import { withRole } from '@/api/middleware/auth';
import prisma from '@/api/db/client';
import { success, serverError, forbidden } from '@/api/utils/response';

// GET: Trainer Dashboard statistics
export const GET = withRole(['TRAINER'], async (req: NextRequest, user: any) => {
  try {
    const { userId, gymId, branchId } = user;

    if (!gymId || !branchId) {
      return forbidden("Trainer is not assigned to a gym and branch");
    }

    // Protect: verify trainer is active
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { status: true }
    });
    if (!dbUser || dbUser.status !== 'ACTIVE') {
      return forbidden("Trainer account is inactive");
    }

    // 1. Trainer Profile Summary
    const trainerProfile = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            gender: true,
            dateOfBirth: true,
            profileImage: true,
            emergencyContact: true
          }
        },
        trainer: {
          select: {
            specialization: true,
            experienceYears: true,
            certification: true
          }
        }
      }
    });

    // 2. Branch Member Count
    const branchMemberCount = await prisma.member.count({
      where: {
        user: {
          gymId,
          branchId,
          role: 'MEMBER'
        }
      }
    });

    // 3. Today's Attendance Count
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayAttendanceCount = await prisma.attendance.count({
      where: {
        branchId,
        checkIn: {
          gte: startOfToday
        }
      }
    });

    // 4. Members with membership expiring in next 7 days
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const expiringMemberships = await prisma.memberMembership.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: now,
          lte: sevenDaysFromNow
        },
        member: {
          user: {
            gymId,
            branchId
          }
        }
      },
      include: {
        member: {
          include: {
            user: {
              include: {
                profile: true
              }
            }
          }
        },
        membershipPlan: true
      },
      orderBy: {
        endDate: 'asc'
      }
    });

    return success({
      trainerProfile,
      branchMemberCount,
      todayAttendanceCount,
      expiringMemberships
    });
  } catch (error: any) {
    return serverError(error);
  }
});

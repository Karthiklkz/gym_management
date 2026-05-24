import { NextRequest } from 'next/server';
import { withRole } from '@/api/middleware/auth';
import prisma from '@/api/db/client';
import { success, serverError, forbidden, notifyNotFound, badRequest } from '@/api/utils/response';

// GET: View single branch member details (profile, memberships, and last 30 days attendance)
export const GET = withRole(['TRAINER'], async (req: NextRequest, user: any, { params }: { params: { id: string } }) => {
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

    // Fetch member user details and verify scoping
    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            gymId: true,
            branchId: true,
            status: true,
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
        },
        memberships: {
          include: {
            membershipPlan: {
              select: {
                name: true,
                durationDays: true,
                price: true,
                description: true
              }
            }
          },
          orderBy: {
            endDate: 'desc'
          }
        }
      }
    });

    if (!member || member.user.gymId !== gymId || member.user.branchId !== branchId) {
      return notifyNotFound("Member not found in your branch");
    }

    // Fetch last 30 days attendance
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const attendance = await prisma.attendance.findMany({
      where: {
        memberId: id,
        checkIn: {
          gte: thirtyDaysAgo
        }
      },
      orderBy: {
        checkIn: 'desc'
      }
    });

    return success({
      member,
      attendance
    });
  } catch (error: any) {
    return serverError(error);
  }
});

// PUT: Trainer updates basic member profile fields
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

    // Fetch member and verify ownership
    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        user: true
      }
    });

    if (!member || member.user.gymId !== gymId || member.user.branchId !== branchId) {
      return notifyNotFound("Member not found in your branch");
    }

    const body = await req.json();
    const { firstName, lastName, gender, dateOfBirth, emergencyContact, profileImage } = body;

    if (!firstName) {
      return badRequest("First name is required");
    }

    // Update user profile in a transaction
    const updatedMember = await prisma.$transaction(async (tx) => {
      // Update UserProfile
      const profile = await tx.userProfile.update({
        where: { userId: member.userId },
        data: {
          firstName,
          lastName,
          gender,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          emergencyContact,
          profileImage
        }
      });

      // Write Audit Log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'UPDATE_MEMBER_PROFILE',
          entity: 'Member',
          entityId: id,
          metadata: {
            changes: { firstName, lastName, gender, dateOfBirth, emergencyContact, profileImage }
          }
        }
      });

      return profile;
    });

    return success(updatedMember, "Member profile updated successfully");
  } catch (error: any) {
    return serverError(error);
  }
});

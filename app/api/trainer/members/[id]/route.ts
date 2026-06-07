import { NextRequest } from 'next/server';
import { withRole } from '@/api/middleware/auth';
import prisma from '@/api/db/client';
import { success, serverError, forbidden, notifyNotFound, badRequest } from '@/api/utils/response';

// GET: View single branch member details (profile, memberships, and last 30 days attendance)
export const GET = withRole(['TRAINER', 'GYM_ADMIN'], async (req: NextRequest, user: any, { params }: { params: { id: string } }) => {
  try {
    const { userId, gymId, branchId, role } = user;
    const { id } = params;

    const isGymAdmin = role === 'GYM_ADMIN';
    if (!gymId || (!isGymAdmin && !branchId)) {
      return forbidden("User is not properly assigned to a gym/branch");
    }

    // Verify user is active
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { status: true }
    });
    if (!dbUser || dbUser.status !== 'ACTIVE') {
      return forbidden("Account is inactive");
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

    if (!member || member.user.gymId !== gymId || (!isGymAdmin && member.user.branchId !== branchId)) {
      return notifyNotFound("Member not found in your scope");
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

// PUT: Trainer/Gym Admin updates member profile fields
export const PUT = withRole(['TRAINER', 'GYM_ADMIN'], async (req: NextRequest, user: any, { params }: { params: { id: string } }) => {
  try {
    const { userId, gymId, branchId, role } = user;
    const { id } = params;

    const isGymAdmin = role === 'GYM_ADMIN';
    if (!gymId || (!isGymAdmin && !branchId)) {
      return forbidden("User is not properly assigned to a gym/branch");
    }

    // Verify user is active
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { status: true }
    });
    if (!dbUser || dbUser.status !== 'ACTIVE') {
      return forbidden("Account is inactive");
    }

    // Fetch member and verify ownership
    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        user: true
      }
    });

    if (!member || member.user.gymId !== gymId || (!isGymAdmin && member.user.branchId !== branchId)) {
      return notifyNotFound("Member not found in your scope");
    }

    const body = await req.json();
    const { firstName, lastName, gender, dateOfBirth, emergencyContact, profileImage, classType } = body;

    if (!firstName) {
      return badRequest("First name is required");
    }

    // Update user profile in a transaction
    const updatedMember = await prisma.$transaction(async (tx) => {
      // Update UserProfile
      await tx.userProfile.update({
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

      // Update Member classType
      if (classType !== undefined) {
        await tx.member.update({
          where: { id },
          data: {
            classType
          }
        });
      }

      // Write Audit Log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'UPDATE_MEMBER_PROFILE',
          entity: 'Member',
          entityId: id,
          metadata: {
            changes: { firstName, lastName, gender, dateOfBirth, emergencyContact, profileImage, classType }
          }
        }
      });

      // Fetch the updated member profile to return
      const updated = await tx.member.findUnique({
        where: { id },
        include: {
          user: {
            include: {
              profile: true
            }
          }
        }
      });
      return updated;
    });

    return success(updatedMember, "Member profile updated successfully");
  } catch (error: any) {
    return serverError(error);
  }
});

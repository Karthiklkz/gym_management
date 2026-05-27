import { NextRequest } from 'next/server';
import { withRole } from '@/api/middleware/auth';
import prisma from '@/api/db/client';
import { success, serverError, forbidden, notifyNotFound, badRequest } from '@/api/utils/response';

// GET: Retrieve own profile (excluding medical notes)
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

    // Fetch user and profile
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
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
        member: {
          select: {
            id: true,
            joinDate: true
            // EXCLUDE: medicalNotes as per security rules
          }
        }
      }
    });

    if (!userData || !userData.member) {
      return notifyNotFound("Member record not found");
    }

    return success({
      userId: userData.id,
      email: userData.email,
      phone: userData.phone,
      joinDate: userData.member.joinDate,
      profile: userData.profile || {}
    });
  } catch (error: any) {
    return serverError(error);
  }
});

// PUT: Update own basic profile details (excluding email, phone, medical notes)
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

    // Fetch member
    const member = await prisma.member.findUnique({
      where: { userId }
    });

    if (!member) {
      return notifyNotFound("Member profile not found");
    }

    const body = await req.json();
    const { firstName, lastName, gender, dateOfBirth, emergencyContact, profileImage } = body;

    if (!firstName) {
      return badRequest("First name is required");
    }

    // Update user profile in a transaction
    const updatedProfile = await prisma.$transaction(async (tx) => {
      // Find or create UserProfile
      const existingProfile = await tx.userProfile.findUnique({
        where: { userId }
      });

      let profile;
      if (existingProfile) {
        profile = await tx.userProfile.update({
          where: { userId },
          data: {
            firstName,
            lastName,
            gender,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            emergencyContact,
            profileImage
          }
        });
      } else {
        profile = await tx.userProfile.create({
          data: {
            userId,
            firstName,
            lastName,
            gender,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            emergencyContact,
            profileImage
          }
        });
      }

      // Write Audit Log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'MEMBER_UPDATE_SELF_PROFILE',
          entity: 'UserProfile',
          entityId: profile.id,
          metadata: {
            changes: { firstName, lastName, gender, dateOfBirth, emergencyContact, profileImage }
          }
        }
      });

      return profile;
    });

    return success(updatedProfile, "Your profile has been updated successfully");
  } catch (error: any) {
    return serverError(error);
  }
});

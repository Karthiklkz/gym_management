import { NextRequest } from 'next/server';
import { withRole } from '@/api/middleware/auth';
import prisma from '@/api/db/client';
import { success, serverError, forbidden, badRequest } from '@/api/utils/response';

// GET: View trainer's own personal and professional details
export const GET = withRole(['TRAINER'], async (req: NextRequest, user: any) => {
  try {
    const { userId } = user;

    const trainer = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
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

    if (!trainer) {
      return forbidden("Trainer profile not found");
    }

    if (trainer.status !== 'ACTIVE') {
      return forbidden("Trainer account is inactive");
    }

    return success(trainer);
  } catch (error: any) {
    return serverError(error);
  }
});

// PUT: Trainer updates own personal and professional details
export const PUT = withRole(['TRAINER'], async (req: NextRequest, user: any) => {
  try {
    const { userId } = user;

    // Verify active status
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { status: true }
    });
    if (!dbUser || dbUser.status !== 'ACTIVE') {
      return forbidden("Trainer account is inactive");
    }

    const body = await req.json();
    const { 
      firstName, lastName, gender, dateOfBirth, emergencyContact, profileImage,
      specialization, experienceYears, certification, phone 
    } = body;

    if (!firstName) {
      return badRequest("First name is required");
    }

    const updatedTrainer = await prisma.$transaction(async (tx) => {
      // 1. Update User Profile
      const profile = await tx.userProfile.update({
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

      // 2. Update Trainer Profile Details
      const trainerDetails = await tx.trainer.update({
        where: { userId },
        data: {
          specialization,
          experienceYears: experienceYears ? parseInt(experienceYears, 10) : null,
          certification
        }
      });

      // 3. Update User phone if provided
      if (phone !== undefined) {
        await tx.user.update({
          where: { id: userId },
          data: { phone }
        });
      }

      // 4. Write Audit Log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'UPDATE_OWN_PROFILE',
          entity: 'Trainer',
          entityId: userId,
          metadata: {
            changes: { 
              firstName, lastName, gender, dateOfBirth, emergencyContact, profileImage,
              specialization, experienceYears, certification, phone 
            }
          }
        }
      });

      return { profile, trainerDetails };
    });

    return success(updatedTrainer, "Profile updated successfully");
  } catch (error: any) {
    return serverError(error);
  }
});

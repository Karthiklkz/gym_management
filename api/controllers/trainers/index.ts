import prisma from '../../db/client';
import bcrypt from 'bcryptjs';

export const getTrainers = async (gymId?: string) => {
  try {
    return await prisma.trainer.findMany({
      where: gymId ? { user: { gymId } } : {},
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            profile: true
          }
        }
      }
    });
  } catch (error) {
    throw new Error('Failed to fetch trainers');
  }
};

export const createTrainerWithUser = async (data: any, gymId: string, creatorId: string) => {
  const { email, password, firstName, lastName, phone, specialization, experienceYears, certification } = data;

  const passwordHash = await bcrypt.hash(password || 'Trainer@123', 10);
  
  return await prisma.$transaction(async (tx: any) => {
    // 1. Create User
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        role: 'TRAINER',
        gymId,
        phone,
        profile: {
          create: {
            firstName,
            lastName,
          }
        }
      }
    });

    // 2. Create Trainer
    const trainer = await tx.trainer.create({
      data: {
        userId: user.id,
        specialization,
        experienceYears,
        certification,
        createdBy: creatorId
      },
      include: {
        user: {
          include: { profile: true }
        }
      }
    });

    return trainer;
  });
};

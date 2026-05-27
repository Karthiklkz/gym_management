import { NextRequest } from 'next/server';
import { withAuth } from '@/api/middleware/auth';
import { sendResponse, sendError } from '@/api/utils/response';
import prisma from '@/api/db/client';
import bcrypt from 'bcryptjs';

export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
     const gymId = user.gymId;
     const isSuperAdmin = user.role === 'SUPER_ADMIN';

     if (!gymId && !isSuperAdmin) return sendResponse([]);

     const trainers = await prisma.trainer.findMany({
       where: isSuperAdmin ? {} : {
         user: { gymId }
       },
       include: {
         user: {
           include: {
             profile: true,
             gym: {
               select: {
                 name: true
               }
             }
           }
         }
       }
     });

     const trainersWithPresence = await Promise.all(trainers.map(async (trainer) => {
       const logs = await prisma.auditLog.findMany({
         where: {
           userId: trainer.userId,
           action: 'TRAINER_CHECK_IN'
         },
         select: {
           createdAt: true
         },
         orderBy: {
           createdAt: 'asc'
         }
       });

       const monthlyPresence: Record<string, number> = {};
       const uniqueDays = new Set<string>();

       for (const log of logs) {
         const date = new Date(log.createdAt);
         const dayKey = date.toISOString().split('T')[0];
         if (!uniqueDays.has(dayKey)) {
           uniqueDays.add(dayKey);
           const monthName = date.toLocaleString('default', { month: 'short', year: 'numeric' });
           monthlyPresence[monthName] = (monthlyPresence[monthName] || 0) + 1;
         }
       }

       return {
         ...trainer,
         monthlyPresence
       };
     }));

     return sendResponse(trainersWithPresence);
  } catch (error: any) {
    return sendError(error);
  }
});

export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const body = await req.json();
    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    const targetGymId = isSuperAdmin ? body.gymId : user.gymId;

    if (!targetGymId) {
      return sendError('Gym association is required', 400);
    }

    const { firstName, lastName, email, phone, specialization, experienceYears, certification } = body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return sendError('Email is already taken', 400);
    }

    const defaultPasswordHash = await bcrypt.hash('trainer123', 10);

    const branch = await prisma.branch.findFirst({ where: { gymId: targetGymId } });
    if (!branch) {
      throw new Error('No branch found for the selected gym.');
    }

    const newTrainer = await prisma.user.create({
      data: {
        gymId: targetGymId,
        branchId: branch.id,
        email,
        phone,
        passwordHash: defaultPasswordHash,
        role: 'TRAINER',
        status: 'ACTIVE',
        profile: {
          create: {
            firstName,
            lastName,
          }
        },
        trainer: {
          create: {
            specialization,
            experienceYears: experienceYears ? parseInt(experienceYears, 10) : undefined,
            certification,
          }
        }
      },
      include: {
        trainer: true,
        profile: true
      }
    });

    return sendResponse(newTrainer, 201, 'Trainer created successfully');
  } catch (error: any) {
    return sendError(error);
  }
});

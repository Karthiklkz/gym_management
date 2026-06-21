import { NextRequest } from 'next/server';
import { withAuth } from '@/api/middleware/auth';
import { sendResponse, sendError } from '@/api/utils/response';
import prisma from '@/api/db/client';

export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    const gymId = user.gymId;
    if (!gymId) {
      return sendResponse([]);
    }

    // 1. Query existing classes
    let classes = await prisma.class.findMany({
      where: { gymId },
      include: {
        trainer: {
          include: {
            user: {
              include: { profile: true }
            }
          }
        },
        branch: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // 2. Auto-seed if empty
    if (classes.length === 0) {
      // Find a default branch for this gym to associate classes with
      const branch = await prisma.branch.findFirst({
        where: { gymId }
      });
      // Find any trainer in this gym
      const trainer = await prisma.trainer.findFirst({
        where: { user: { gymId } }
      });

      const branchId = branch?.id || null;
      const trainerId = trainer?.id || null;

      // Seed 3 realistic classes
      await prisma.class.createMany({
        data: [
          {
            gymId,
            branchId,
            trainerId,
            name: "CrossFit Power Hour",
            startTime: "08:00 AM",
            endTime: "09:00 AM",
            currentCapacity: 18,
            maxCapacity: 20,
            level: "ADVANCED"
          },
          {
            gymId,
            branchId,
            trainerId,
            name: "Vinyasa Flow Yoga",
            startTime: "10:30 AM",
            endTime: "11:30 AM",
            currentCapacity: 12,
            maxCapacity: 15,
            level: "BEGINNER"
          },
          {
            gymId,
            branchId,
            trainerId,
            name: "Spin & Cardio Burn",
            startTime: "05:30 PM",
            endTime: "06:30 PM",
            currentCapacity: 24,
            maxCapacity: 25,
            level: "INTERMEDIATE"
          }
        ]
      });

      // Refetch
      classes = await prisma.class.findMany({
        where: { gymId },
        include: {
          trainer: {
            include: {
              user: {
                include: { profile: true }
              }
            }
          },
          branch: true
        },
        orderBy: { createdAt: 'asc' }
      });
    }

    return sendResponse(classes);
  } catch (error: any) {
    return sendError(error);
  }
});

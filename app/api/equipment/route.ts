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

    // 1. Query existing equipment
    let equipment = await prisma.equipment.findMany({
      where: { gymId },
      include: {
        branch: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // 2. Auto-seed if empty
    if (equipment.length === 0) {
      // Find a default branch for this gym to associate equipment with
      const branch = await prisma.branch.findFirst({
        where: { gymId }
      });
      const branchId = branch?.id || null;

      // Seed default physical equipment
      await prisma.equipment.createMany({
        data: [
          {
            gymId,
            branchId,
            name: "Matrix Fitness Treadmills",
            category: "Cardio",
            quantity: 8,
            status: "ACTIVE"
          },
          {
            gymId,
            branchId,
            name: "Olympic Squat Racks & Barbells",
            category: "Strength",
            quantity: 4,
            status: "ACTIVE"
          },
          {
            gymId,
            branchId,
            name: "Cable Crossover Machines",
            category: "Strength",
            quantity: 2,
            status: "MAINTENANCE"
          },
          {
            gymId,
            branchId,
            name: "Rubber Dumbbell Rack Set (5 - 100 lbs)",
            category: "Free Weights",
            quantity: 2,
            status: "ACTIVE"
          }
        ]
      });

      // Refetch
      equipment = await prisma.equipment.findMany({
        where: { gymId },
        include: {
          branch: true
        },
        orderBy: { createdAt: 'asc' }
      });
    }

    return sendResponse(equipment);
  } catch (error: any) {
    return sendError(error);
  }
});

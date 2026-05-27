import { NextRequest } from 'next/server';
import { withRole } from '@/api/middleware/auth';
import { getGymById } from '@/api/controllers/gyms';
import prisma from '@/api/db/client';
import { success, serverError, notifyNotFound, badRequest } from '@/api/utils/response';

// GET: Super Admin views a specific gym data
export const GET = withRole(['SUPER_ADMIN'], async (req: NextRequest, user, { params }: { params: { id: string } }) => {
  try {
    const { id } = params;
    const gym = await getGymById(id);
    
    if (!gym) {
      return notifyNotFound("Gym not found");
    }
    
    return success(gym);
  } catch (error: any) {
    return serverError(error);
  }
});

// PUT: Super Admin updates a gym's details, status, and/or subscription plan
export const PUT = withRole(['SUPER_ADMIN'], async (req: NextRequest, user, { params }: { params: { id: string } }) => {
  try {
    const { id } = params;
    const body = await req.json();
    const { name, ownerName, email, phone, subscriptionPlanId, status } = body;

    const gymExists = await prisma.gym.findUnique({
      where: { id }
    });

    if (!gymExists) {
      return notifyNotFound("Gym not found");
    }

    // Update gym details
    const updatedGym = await prisma.gym.update({
      where: { id },
      data: {
        name,
        ownerName,
        email,
        phone,
        subscriptionPlanId,
        status,
      },
      include: {
        subscriptionPlan: true
      }
    });

    return success(updatedGym, "Gym updated successfully");
  } catch (error: any) {
    return serverError(error);
  }
});

// DELETE: Super Admin deletes a gym
export const DELETE = withRole(['SUPER_ADMIN'], async (req: NextRequest, user, { params }: { params: { id: string } }) => {
  try {
    const { id } = params;

    const gymExists = await prisma.gym.findUnique({
      where: { id }
    });

    if (!gymExists) {
      return notifyNotFound("Gym not found");
    }

    // Delete gym (Cascade will handle branches, members, trainers, features etc.)
    await prisma.gym.delete({
      where: { id }
    });

    return success(null, "Gym deleted successfully");
  } catch (error: any) {
    return serverError(error);
  }
});


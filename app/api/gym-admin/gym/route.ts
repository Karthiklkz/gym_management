/**
 * @openapi
 * /api/gym-admin/gym:
 *   get:
 *     summary: View own gym data
 *     description: Returns detailed information about the gym the logged-in admin belongs to. Restricted to GYM_ADMIN.
 *     tags: [Gym Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved gym data
 *       404:
 *         description: Gym not found
 */
import { NextRequest } from 'next/server';
import { withRole } from '@/api/middleware/auth';
import { getGymById } from '@/api/controllers/gyms';
import { success, serverError, forbidden, notifyNotFound, badRequest } from '@/api/utils/response';
import prisma from '@/api/db/client';

// GET: Gym Admin/Trainer views their own gym data
export const GET = withRole(['GYM_ADMIN', 'TRAINER'], async (req: NextRequest, user) => {
  try {
    if (!user.gymId) {
      return forbidden("User is not associated with any gym");
    }

    const gym = await getGymById(user.gymId);
    
    if (!gym) {
      return notifyNotFound("Gym not found");
    }
    
    return success(gym);
  } catch (error: any) {
    return serverError(error);
  }
});

// PUT: Gym Admin updates their own gym data
export const PUT = withRole(['GYM_ADMIN'], async (req: NextRequest, user) => {
  try {
    if (!user.gymId) {
      return forbidden("User is not associated with any gym");
    }

    const body = await req.json();
    const { name, ownerName, phone, location, address, pincode, gst } = body;

    if (!name) {
      return badRequest("Gym name is required");
    }
    if (!ownerName) {
      return badRequest("Owner name is required");
    }
    if (!phone) {
      return badRequest("Phone number is required");
    }

    const updatedGym = await prisma.gym.update({
      where: { id: user.gymId },
      data: {
        name,
        ownerName,
        phone,
        location,
        address,
        pincode,
        gst
      }
    });

    return success(updatedGym, "Gym details updated successfully");
  } catch (error: any) {
    return serverError(error);
  }
});

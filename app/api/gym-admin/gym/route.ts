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
import { success, serverError, forbidden, notifyNotFound } from '@/api/utils/response';

// GET: Gym Admin views their own gym data
export const GET = withRole(['GYM_ADMIN'], async (req: NextRequest, user) => {
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

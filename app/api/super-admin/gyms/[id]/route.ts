import { NextRequest } from 'next/server';
import { withRole } from '@/api/middleware/auth';
import { getGymById } from '@/api/controllers/gyms';
import { success, serverError, notifyNotFound } from '@/api/utils/response';

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

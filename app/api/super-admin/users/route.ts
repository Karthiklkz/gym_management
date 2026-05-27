/**
 * @openapi
 * /api/super-admin/users:
 *   get:
 *     summary: List all users globally
 *     description: Returns a list of all users from all gyms. Restricted to SUPER_ADMIN.
 *     tags: [Super Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved all users
 *       403:
 *         description: Forbidden
 */
import { NextRequest } from 'next/server';
import { withRole } from '@/api/middleware/auth';
import { getAllUsers } from '@/api/controllers/users';
import { success, serverError } from '@/api/utils/response';

// GET: Super Admin views all users
export const GET = withRole(['SUPER_ADMIN'], async (req: NextRequest) => {
  try {
    const users = await getAllUsers();
    return success(users);
  } catch (error: any) {
    return serverError(error);
  }
});

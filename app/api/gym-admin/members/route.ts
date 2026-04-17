/**
 * @openapi
 * /api/gym-admin/members:
 *   get:
 *     summary: List all members of the gym
 *     description: Returns a list of members associated with the logged-in admin's gym. Restricted to GYM_ADMIN.
 *     tags: [Gym Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved members list
 *       403:
 *         description: Forbidden - Not associated with a gym
 *   post:
 *     summary: Create a new member
 *     description: Creates a new member user and linked member record for the logged-in admin's gym. Restricted to GYM_ADMIN.
 *     tags: [Gym Admin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, firstName]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               phone: { type: string }
 *               medicalNotes: { type: string }
 *     responses:
 *       201:
 *         description: Member created successfully
 *       400:
 *         description: Missing required fields
 */
import { NextRequest } from 'next/server';
import { withRole } from '@/api/middleware/auth';
import { getMembers, createMemberWithUser } from '@/api/controllers/members';
import { success, created, serverError, forbidden, badRequest } from '@/api/utils/response';

// GET: Gym Admin lists all members of their own gym
export const GET = withRole(['GYM_ADMIN'], async (req: NextRequest, user) => {
  try {
    if (!user.gymId) {
      return forbidden("User is not associated with any gym");
    }

    const members = await getMembers(user.gymId);
    return success(members);
  } catch (error: any) {
    return serverError(error);
  }
});

// POST: Gym Admin creates a member in their own gym
export const POST = withRole(['GYM_ADMIN', 'SUPER_ADMIN'], async (req: NextRequest, user) => {
  try {
    if (!user.gymId) {
      return forbidden("User is not associated with any gym");
    }

    const body = await req.json();

    // We should validate the body here as well, but for brevity using the controller's logic
    if (!body.email || !body.firstName) {
      return badRequest("Missing required fields: email, firstName");
    }

    const member = await createMemberWithUser(body, user.gymId, user.userId);

    return created(member, "Member created successfully");
  } catch (error: any) {
    return serverError(error);
  }
});

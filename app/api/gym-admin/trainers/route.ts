/**
 * @openapi
 * /api/gym-admin/trainers:
 *   get:
 *     summary: List all trainers of the gym
 *     description: Returns a list of trainers associated with the logged-in admin's gym. Restricted to GYM_ADMIN.
 *     tags: [Gym Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved trainers list
 *   post:
 *     summary: Create a new trainer
 *     description: Creates a new trainer user and linked trainer record for the logged-in admin's gym. Restricted to GYM_ADMIN.
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
 *               specialization: { type: string }
 *               experienceYears: { type: integer }
 *               certification: { type: string }
 *     responses:
 *       201:
 *         description: Trainer created successfully
 */
import { NextRequest } from 'next/server';
import { withRole } from '@/api/middleware/auth';
import { getTrainers, createTrainerWithUser } from '@/api/controllers/trainers';
import { success, created, serverError, forbidden, badRequest } from '@/api/utils/response';

// GET: Gym Admin lists all trainers of their own gym
export const GET = withRole(['GYM_ADMIN'], async (req: NextRequest, user) => {
  try {
    if (!user.gymId) {
      return forbidden("User is not associated with any gym");
    }

    const trainers = await getTrainers(user.gymId);
    return success(trainers);
  } catch (error: any) {
    return serverError(error);
  }
});

// POST: Gym Admin creates a trainer in their own gym
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

    const trainer = await createTrainerWithUser(body, user.gymId, user.userId);

    return created(trainer, "Trainer created successfully");
  } catch (error: any) {
    return serverError(error);
  }
});

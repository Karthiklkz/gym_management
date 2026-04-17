/**
 * @openapi
 * /api/super-admin/gyms:
 *   get:
 *     summary: List all gyms
 *     description: Returns a list of all registered gyms in the system. Restricted to SUPER_ADMIN.
 *     tags: [Super Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved gyms list
 *       403:
 *         description: Forbidden - Not a Super Admin
 *   post:
 *     summary: Create a new gym with admin
 *     description: Creates a new gym and its primary admin user. Restricted to SUPER_ADMIN.
 *     tags: [Super Admin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, ownerName, email, phone, subscriptionPlanId, adminFirstName, adminEmail, adminPassword]
 *             properties:
 *               name: { type: string }
 *               ownerName: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               subscriptionPlanId: { type: string, format: uuid }
 *               adminFirstName: { type: string }
 *               adminLastName: { type: string }
 *               adminEmail: { type: string }
 *               adminPassword: { type: string }
 *               adminPhone: { type: string }
 *     responses:
 *       201:
 *         description: Gym and Admin created successfully
 *       400:
 *         description: Validation error or admin email already exists
 */
import { NextRequest } from 'next/server';
import { withRole } from '@/api/middleware/auth';
import { createGymWithAdmin, getGyms } from '@/api/controllers/gyms';
import { CreateGymSchema } from '@/api/models/gym';
import { success, created, serverError, badRequest } from '@/api/utils/response';

// GET: Super Admin views all gyms
export const GET = withRole(['SUPER_ADMIN'], async (req: NextRequest) => {
  try {
    const gyms = await getGyms();
    return success(gyms);
  } catch (error: any) {
    return serverError(error);
  }
});

// POST: Super Admin creates a gym along with a gym admin
export const POST = withRole(['SUPER_ADMIN'], async (req: NextRequest, user) => {
  try {
    const body = await req.json();
    
    // Validate input
    const validatedData = CreateGymSchema.safeParse(body);
    if (!validatedData.success) {
      return badRequest(validatedData.error);
    }

    const { gym, adminUser } = await createGymWithAdmin(validatedData.data, user.userId);
    
    return created({ gym, adminUser }, "Gym created successfully with Admin credentials");
  } catch (error: any) {
    if (error.status === 400) return badRequest(error.message);
    return serverError(error);
  }
});

/**
 * @openapi
 * /api/auth/signup:
 *   post:
 *     summary: Create a new user
 *     description: Registers a new user with a specific role (SUPER_ADMIN, GYM_ADMIN, etc.).
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, role, firstName]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *               role: { type: string, enum: [SUPER_ADMIN, GYM_ADMIN, TRAINER, MEMBER] }
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               phone: { type: string }
 *               gymId: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error or user already exists
 */
import { NextRequest } from 'next/server';
import { signup } from '@/api/controllers';
import { SignupSchema } from '@/api/models';
import { sendResponse, sendError } from '@/api/utils/response';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = SignupSchema.parse(body);
    const user = await signup(validatedData);

    return sendResponse({ 
      id: user.id,
      email: user.email,
      role: user.role
    }, 201, 'User created successfully');

  } catch (error: any) {
    return sendError(error);
  }
}

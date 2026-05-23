/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user
 *     description: Validates user credentials and returns a JWT token.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
import { NextRequest } from 'next/server';
import { login } from '@/api/controllers';
import { LoginSchema } from '@/api/models';
import { sendResponse, sendError } from '@/api/utils/response';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const validatedData = LoginSchema.parse(body);

    const result = await login(validatedData);

    return sendResponse(result, 200, "Login successful");

  } catch (error: any) {
    return sendError(error, 401);
  }
}

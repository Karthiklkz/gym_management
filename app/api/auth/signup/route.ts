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

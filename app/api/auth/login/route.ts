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

    return sendResponse(result);

  } catch (error: any) {
    return sendError(error, 401);
  }
}

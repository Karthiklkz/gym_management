import { NextRequest } from 'next/server';
import { z } from 'zod';
import { sendError } from './response';

/**
 * Validates request body against a Zod schema
 */
export const validateBody = async <T>(req: NextRequest, schema: z.ZodSchema<T>): Promise<T> => {
  try {
    const body = await req.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON body');
    }
    throw error;
  }
};

/**
 * Validates search params (query) against a Zod schema
 */
export const validateQuery = <T>(req: NextRequest, schema: z.ZodSchema<T>): T => {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  return schema.parse(params);
};

/**
 * High-level wrapper for route handlers to reduce boilerplate and handle errors consistently
 */
export const tryCatch = (handler: (req: NextRequest, ...args: any[]) => Promise<any>) => {
  return async (req: NextRequest, ...args: any[]) => {
    try {
      return await handler(req, ...args);
    } catch (error: any) {
      return sendError(error);
    }
  };
};

import { NextResponse } from 'next/server';
import { ZodError, ZodIssue } from 'zod';
import { ApiResponse } from '../types/shared';

/**
 * Standard Success Response
 */
export const sendResponse = <T>(
  data: T,
  status: number = 200,
  message: string = 'Operation successful'
) => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response, { status });
};

/**
 * Standard Error Response
 */
export const sendError = (
  error: any,
  status: number = 500,
  message?: string
) => {
  console.error('[API ERROR]:', error);
  let errorMessage = message || 'Something went wrong';
  let details: any = null;

  if (error instanceof ZodError) {
    errorMessage = 'Validation failed';
    details = error.issues.map((err: ZodIssue) => ({
      path: err.path.join('.'),
      message: err.message
    }));
    status = 400;
  } else if (error instanceof Error) {
    errorMessage = message || error.message;
    if (process.env.NODE_ENV === 'development') {
      details = { stack: error.stack };
    }
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  const response: ApiResponse = {
    success: false,
    error: errorMessage,
    details,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response, { status });
};

/**
 * Common HTTP Shortcuts
 */
export const success = (data: any, message?: string) => sendResponse(data, 200, message);
export const created = (data: any, message?: string) => sendResponse(data, 201, message);
export const badRequest = (error: any, message?: string) => sendError(error, 400, message);
export const unauthorized = (message: string = 'Unauthorized') => sendError(message, 401);
export const forbidden = (message: string = 'Forbidden') => sendError(message, 403);
export const notifyNotFound = (message: string = 'Resource not found') => sendError(message, 404);
export const serverError = (error: any) => sendError(error, 500);

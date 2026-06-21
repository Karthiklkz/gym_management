import { sendResponse } from '@/api/utils/response';

export async function POST() {
  const response = sendResponse({ success: true }, 200, "Logged out successfully");
  
  // Clear the secure HTTP-only token cookie by setting expiration to epoch
  response.cookies.set('token', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/'
  });

  return response;
}

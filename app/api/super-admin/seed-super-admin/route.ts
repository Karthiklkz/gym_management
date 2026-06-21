import { NextRequest } from 'next/server';
import prisma from '@/api/db/client';
import bcrypt from 'bcryptjs';
import { success, serverError, sendError } from '@/api/utils/response';

export async function GET(req: NextRequest) {
  try {
    // Check if any SUPER_ADMIN already exists in the system to prevent unauthorized resetting
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });

    if (existingSuperAdmin) {
      const error = new Error('Access denied: A Super Admin account already exists in the database.');
      (error as any).status = 403;
      throw error;
    }

    const email = 'superadmin@peakpulse.com';
    const password = 'SuperAdmin@123';
    const passwordHash = await bcrypt.hash(password, 12);

    const superAdmin = await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash,
        status: 'ACTIVE'
      },
      create: {
        email,
        passwordHash,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        profile: {
          create: {
            firstName: 'Alex',
            lastName: 'Admin'
          }
        }
      }
    });

    // Also check and update the password for super@admin.com if it exists in the system
    const existingSuper = await prisma.user.findUnique({
      where: { email: 'super@admin.com' }
    });

    if (existingSuper) {
      await prisma.user.update({
        where: { id: existingSuper.id },
        data: {
          passwordHash,
          status: 'ACTIVE'
        }
      });
    }

    return success({
      option1: {
        email: 'superadmin@peakpulse.com',
        password: 'SuperAdmin@123'
      },
      option2: existingSuper ? {
        email: 'super@admin.com',
        password: 'SuperAdmin@123'
      } : null
    }, "Super Admin credentials initialized successfully!");
  } catch (error: any) {
    const status = error.status || 500;
    return sendError(error, status);
  }
}

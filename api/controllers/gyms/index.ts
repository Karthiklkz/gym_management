import bcrypt from 'bcryptjs';
import prisma from '../../db/client';
import { CreateGymInput } from '../../models/gym';

export const getGyms = async () => {
  return await prisma.gym.findMany({
    include: {
      subscriptionPlan: true,
      _count: {
        select: { users: true, branches: true }
      }
    }
  });
};

/**
 * Super Admin creates a gym along with it's primary admin credentials
 */
export const createGymWithAdmin = async (data: CreateGymInput, creatorId: string) => {
  const { 
    name, ownerName, email, phone, subscriptionPlanId,
    adminFirstName, adminLastName, adminEmail, adminPassword, adminPhone 
  } = data;

  // Check if admin user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingUser) {
    const error = new Error('A user with this admin email already exists');
    (error as any).status = 400;
    throw error;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  // Run in transaction: Create Gym, Create Admin User, Create Admin Profile
  const result = await prisma.$transaction(async (tx: any) => {
    // 1. Create the Gym
    const gym = await tx.gym.create({
      data: {
        name,
        ownerName,
        email,
        phone,
        subscriptionPlanId,
        status: 'ACTIVE',
        createdBy: creatorId
      }
    });

    // 2. Create the Gym Admin user linked to this gym
    const adminUser = await tx.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: 'GYM_ADMIN',
        gymId: gym.id,
        phone: adminPhone,
        profile: {
          create: {
            firstName: adminFirstName,
            lastName: adminLastName,
          }
        }
      },
      include: {
        profile: true
      }
    });

    return { gym, adminUser };
  });

  return result;
};

export const getGymById = async (id: string) => {
  return await prisma.gym.findUnique({
    where: { id },
    include: {
      subscriptionPlan: true,
      branches: true,
      _count: true
    }
  });
};

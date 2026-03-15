import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../db/client';
import config from '../../utils/config';
import { SignupInput, LoginInput } from '../../models/user';

export const signup = async (data: SignupInput) => {
  const { email, password, role, firstName, lastName, phone, gymId, branchId } = data;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    const error = new Error('A user with this email already exists');
    (error as any).status = 400;
    throw error;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user and associated profile in a transaction
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email,
        passwordHash,
        role,
        phone,
        gymId,
        branchId,
        profile: {
          create: {
            firstName,
            lastName,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    // Create role-specific records if needed
    if (role === 'MEMBER') {
      await tx.member.create({
        data: {
          userId: newUser.id,
        },
      });
    } else if (role === 'TRAINER') {
      await tx.trainer.create({
        data: {
          userId: newUser.id,
        },
      });
    }

    return newUser;
  });

  return user;
};

export const login = async (data: LoginInput) => {
  const { email, password } = data;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      profile: true,
    },
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }

  // Generate JWT
  const token = jwt.sign(
    { userId: user.id, role: user.role, gymId: user.gymId },
    config.jwtSecret,
    { expiresIn: '24h' }
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      profile: user.profile,
    },
    token,
  };
};

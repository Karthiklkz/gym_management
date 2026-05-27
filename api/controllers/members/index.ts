import prisma from '../../db/client';
import bcrypt from 'bcryptjs';

export const getMembers = async (gymId?: string) => {
  try {
    return await prisma.member.findMany({
      where: gymId ? { user: { gymId } } : {},
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            profile: true
          }
        },
        memberships: true
      }
    });
  } catch (error) {
    throw new Error('Failed to fetch members');
  }
};

export const createMemberWithUser = async (data: any, gymId: string, creatorId: string) => {
  const { email, password, firstName, lastName, phone, medicalNotes } = data;

  const passwordHash = await bcrypt.hash(password || 'Member@123', 10);
  
  return await prisma.$transaction(async (tx: any) => {
    // 1. Create User
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        role: 'MEMBER',
        gymId,
        phone,
        profile: {
          create: {
            firstName,
            lastName,
          }
        }
      }
    });

    // 2. Create Member
    const member = await tx.member.create({
      data: {
        userId: user.id,
        medicalNotes,
        createdBy: creatorId
      },
      include: {
        user: {
          include: { profile: true }
        }
      }
    });

    return member;
  });
};

export const getMemberById = async (id: string, gymId?: string) => {
  try {
    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        user: true,
        memberships: true
      }
    });

    if (gymId && member?.user.gymId !== gymId) {
      return null;
    }

    return member;
  } catch (error) {
    throw new Error(`Failed to fetch member with ID ${id}`);
  }
};

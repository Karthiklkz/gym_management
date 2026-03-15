import prisma from '../../db/client';

export const getMembers = async () => {
  try {
    return await prisma.member.findMany();
  } catch (error) {
    throw new Error('Failed to fetch members');
  }
};

export const getMemberById = async (id: string) => {
  try {
    return await prisma.member.findUnique({
      where: { id },
    });
  } catch (error) {
    throw new Error(`Failed to fetch member with ID ${id}`);
  }
};

export const createMember = async (data: any) => {
  try {
    return await prisma.member.create({
      data,
    });
  } catch (error) {
    throw new Error('Failed to create member');
  }
};

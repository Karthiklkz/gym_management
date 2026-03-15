import prisma from '../../db/client';

export const getGyms = async () => {
  return await prisma.gym.findMany();
};

export const createGym = async (data: any) => {
  return await prisma.gym.create({ data });
};

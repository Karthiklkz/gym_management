import prisma from '../../db/client';

export const getPayments = async () => {
  return await prisma.payment.findMany();
};

export const createPayment = async (data: any) => {
  return await prisma.payment.create({ data });
};

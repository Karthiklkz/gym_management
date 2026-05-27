import prisma from '../../db/client';

export const getAllUsers = async () => {
    return await prisma.user.findMany({
        include: {
            profile: true,
            gym: {
                select: { name: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
};

export const deleteUser = async (id: string) => {
    return await prisma.user.delete({
        where: { id }
    });
};

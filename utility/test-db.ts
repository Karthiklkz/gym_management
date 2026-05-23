import prisma from '../api/db/client';

async function main() {
  try {
    const plans = await prisma.subscriptionPlan.findMany();
    console.log('Subscription Plans:', plans);

    const gyms = await prisma.gym.findMany();
    console.log('Gyms:', gyms);

    const branches = await prisma.branch.findMany();
    console.log('Branches:', branches);

    const users = await prisma.user.findMany({
      include: {
        profile: true,
      }
    });
    console.log('Users:', users);
  } catch (error) {
    console.error('Error querying DB:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

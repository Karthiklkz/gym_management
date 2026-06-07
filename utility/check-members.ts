import prisma from '../api/db/client';

async function main() {
  try {
    const members = await prisma.member.findMany({
      include: {
        user: {
          include: {
            profile: true,
            gym: true
          }
        }
      }
    });
    console.log('--- Database Members ---');
    for (const m of members) {
      console.log({
        id: m.id,
        memberId: m.memberId,
        name: `${m.user.profile?.firstName} ${m.user.profile?.lastName || ''}`.trim(),
        gym: m.user.gym?.name,
        joinDate: m.joinDate
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

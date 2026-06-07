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
        },
        memberships: {
          include: {
            membershipPlan: true
          }
        }
      }
    });

    console.log('--- Database Members & Memberships ---');
    const today = new Date();
    console.log('Current system time:', today.toISOString());
    console.log('Today set to midnight:', new Date(new Date().setHours(0, 0, 0, 0)).toISOString());
    console.log('5 Days from now:', new Date(new Date().setHours(0, 0, 0, 0) + 5 * 24 * 60 * 60 * 1000).toISOString());

    for (const m of members) {
      console.log(`Member: ${m.user.profile?.firstName} ${m.user.profile?.lastName || ''} (ID: ${m.memberId || 'N/A'})`);
      console.log(`  Gym: ${m.user.gym?.name}`);
      if (!m.memberships || m.memberships.length === 0) {
        console.log('  No memberships found.');
      } else {
        for (const ms of m.memberships) {
          const endDate = new Date(ms.endDate);
          const diffMs = endDate.getTime() - today.getTime();
          const diffDays = diffMs / (1000 * 60 * 60 * 24);
          console.log(`  Membership ID: ${ms.id}`);
          console.log(`    Plan: ${ms.membershipPlan?.name}`);
          console.log(`    Status: ${ms.status}`);
          console.log(`    Start Date: ${new Date(ms.startDate).toISOString()}`);
          console.log(`    End Date: ${endDate.toISOString()}`);
          console.log(`    Days Remaining: ${diffDays.toFixed(2)} days`);
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

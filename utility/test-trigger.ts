import prisma from '../api/db/client';
import bcrypt from 'bcryptjs';

async function main() {
  try {
    console.log('Inserting test user and member...');
    const email = `test-trigger-${Date.now()}@example.com`;
    const passwordHash = await bcrypt.hash('password123', 12);
    
    // Find the gym 'Ganesh's Gym'
    const gym = await prisma.gym.findFirst({
      where: { name: "Ganesh's Gym" }
    });
    
    if (!gym) {
      throw new Error("Ganesh's Gym not found");
    }

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'MEMBER',
        gymId: gym.id,
        profile: {
          create: {
            firstName: 'Trigger',
            lastName: 'Test'
          }
        },
        member: {
          create: {}
        }
      },
      include: {
        member: true
      }
    });

    console.log('Inserted User ID:', newUser.id);
    
    // Fetch the member again to check if trigger populated memberId
    const updatedMember = await prisma.member.findUnique({
      where: { id: newUser.member?.id }
    });

    console.log('Generated Member ID:', updatedMember?.memberId);
    
    // Clean up
    await prisma.user.delete({ where: { id: newUser.id } });
    console.log('Cleaned up test user.');
  } catch (error) {
    console.error('Error in trigger test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

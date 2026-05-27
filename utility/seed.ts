import prisma from '../api/db/client';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Starting seed...');

  // 1. Clean existing tables (except default admin if needed, but we'll update it)
  // Let's delete in correct reverse order of relations
  await prisma.auditLog.deleteMany({});
  await prisma.deviceToken.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.memberMembership.deleteMany({});
  await prisma.membershipPlan.deleteMany({});
  await prisma.member.deleteMany({});
  await prisma.trainer.deleteMany({});
  await prisma.userProfile.deleteMany({});
  await prisma.featureFlag.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.branch.deleteMany({});
  await prisma.gym.deleteMany({});
  await prisma.subscriptionPlan.deleteMany({});

  console.log('Database cleaned.');

  // Hash common password
  const passwordHash = await bcrypt.hash('password123', 10);

  // 2. Create Subscription Plan
  const plan = await prisma.subscriptionPlan.create({
    data: {
      name: 'PeakPulse Premium',
      maxBranches: 10,
      maxTrainers: 50,
      maxMembers: 2000,
      price: 99.99,
      billingCycle: 'monthly',
    },
  });
  console.log('Subscription plan created:', plan.name);

  // 3. Create Gym
  const gym = await prisma.gym.create({
    data: {
      name: 'PeakPulse Elite Fitness',
      ownerName: 'Karthik Selvam',
      email: 'owner@peakpulse.com',
      phone: '+1 555 123 4567',
      subscriptionPlanId: plan.id,
      status: 'ACTIVE',
    },
  });
  console.log('Gym created:', gym.name);

  // 4. Create Branch
  const branch = await prisma.branch.create({
    data: {
      gymId: gym.id,
      name: 'PeakPulse Downtown',
      address: '100 Gym Plaza, Market St',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      phone: '+1 555 987 6543',
    },
  });
  console.log('Branch created:', branch.name);

  // 5. Create Gym Admin (Default User)
  const adminUser = await prisma.user.create({
    data: {
      gymId: gym.id,
      branchId: branch.id,
      email: 'akashkarthickk@gmail.com',
      phone: '9876543210',
      passwordHash: passwordHash,
      role: 'GYM_ADMIN',
      status: 'ACTIVE',
      profile: {
        create: {
          firstName: 'Karthik',
          lastName: 'Selvam',
          gender: 'MALE',
        },
      },
    },
  });
  console.log('Admin user created/updated:', adminUser.email);

  // 6. Create Membership Plans
  const planMonthly = await prisma.membershipPlan.create({
    data: {
      gymId: gym.id,
      name: 'Monthly Basic Membership',
      durationDays: 30,
      price: 49.99,
      description: 'Access to gym equipment and lockers.',
      status: 'ACTIVE',
    },
  });

  const planAnnual = await prisma.membershipPlan.create({
    data: {
      gymId: gym.id,
      name: 'Annual VIP Membership',
      durationDays: 365,
      price: 499.99,
      description: 'Unlimited access to gym, classes, and 1 personal trainer session per month.',
      status: 'ACTIVE',
    },
  });
  console.log('Membership plans created.');

  // 7. Create Trainers
  const trainersData = [
    { email: 'trainer.john@peakpulse.com', firstName: 'John', lastName: 'Doe', specialization: 'Strength & Conditioning', experienceYears: 5, certs: 'CSCS, NASM-CPT' },
    { email: 'trainer.sarah@peakpulse.com', firstName: 'Sarah', lastName: 'Connor', specialization: 'Cardio & HIIT', experienceYears: 8, certs: 'ACE-CPT, Kettlebell L2' },
    { email: 'trainer.mike@peakpulse.com', firstName: 'Mike', lastName: 'Tyson', specialization: 'Boxing & Core', experienceYears: 12, certs: 'USA Boxing Coach' },
  ];

  const trainers = [];
  for (const t of trainersData) {
    const user = await prisma.user.create({
      data: {
        gymId: gym.id,
        branchId: branch.id,
        email: t.email,
        phone: '+1 555 444 0001',
        passwordHash,
        role: 'TRAINER',
        status: 'ACTIVE',
        profile: {
          create: {
            firstName: t.firstName,
            lastName: t.lastName,
            gender: 'MALE',
          },
        },
        trainer: {
          create: {
            specialization: t.specialization,
            experienceYears: t.experienceYears,
            certification: t.certs,
          },
        },
      },
      include: {
        trainer: true,
        profile: true,
      },
    });
    trainers.push(user);
  }
  console.log('Trainers created:', trainers.length);

  // 8. Create Members, memberships, and payments
  const membersData = [
    { email: 'member.bruce@wayne.com', firstName: 'Bruce', lastName: 'Wayne', medical: 'No medical conditions.' },
    { email: 'member.clark@kent.com', firstName: 'Clark', lastName: 'Kent', medical: 'Allergic to green crystals.' },
    { email: 'member.diana@prince.com', firstName: 'Diana', lastName: 'Prince', medical: 'None.' },
    { email: 'member.barry@allen.com', firstName: 'Barry', lastName: 'Allen', medical: 'High metabolism, needs sugar.' },
    { email: 'member.hal@jordan.com', firstName: 'Hal', lastName: 'Jordan', medical: 'Fearless, minor wrist injury.' },
    { email: 'member.arthur@curry.com', firstName: 'Arthur', lastName: 'Curry', medical: 'Excellent lung capacity.' },
    { email: 'member.peter@parker.com', firstName: 'Peter', lastName: 'Parker', medical: 'Minor back pain.' },
    { email: 'member.tony@stark.com', firstName: 'Tony', lastName: 'Stark', medical: 'Cardiac pacemaker installed.' },
    { email: 'member.steve@rogers.com', firstName: 'Steve', lastName: 'Rogers', medical: 'Post-serum perfect health.' },
    { email: 'member.natasha@romanoff.com', firstName: 'Natasha', lastName: 'Romanoff', medical: 'None.' },
  ];

  let count = 0;
  for (const m of membersData) {
    const isVip = count % 3 === 0;
    const mPlan = isVip ? planAnnual : planMonthly;

    const user = await prisma.user.create({
      data: {
        gymId: gym.id,
        branchId: branch.id,
        email: m.email,
        phone: '+1 555 777 9999',
        passwordHash,
        role: 'MEMBER',
        status: 'ACTIVE',
        profile: {
          create: {
            firstName: m.firstName,
            lastName: m.lastName,
            gender: count % 2 === 0 ? 'MALE' : 'FEMALE',
          },
        },
        member: {
          create: {
            medicalNotes: m.medical,
          },
        },
      },
      include: {
        member: true,
        profile: true,
      },
    });

    if (user.member) {
      // Create MemberMembership
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (count * 5)); // varied start dates
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + mPlan.durationDays);

      const membership = await prisma.memberMembership.create({
        data: {
          memberId: user.member.id,
          membershipPlanId: mPlan.id,
          startDate,
          endDate,
          status: 'ACTIVE',
        },
      });

      // Create Payment
      await prisma.payment.create({
        data: {
          memberId: user.member.id,
          membershipId: membership.id,
          amount: mPlan.price,
          paymentMethod: count % 2 === 0 ? 'ONLINE' : 'CASH',
          paymentStatus: 'SUCCESS',
          paidAt: startDate,
          transactionId: `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        },
      });
    }
    count++;
  }

  console.log('Members, memberships, and payments seeded successfully.');
  console.log('Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

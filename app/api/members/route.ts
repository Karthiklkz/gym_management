import { NextRequest } from 'next/server';
import { withAuth } from '@/api/middleware/auth';
import { sendResponse, sendError } from '@/api/utils/response';
import prisma from '@/api/db/client';
import bcrypt from 'bcryptjs';

export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    const gymId = user.gymId;
    if (!gymId) return sendResponse([]);

    const members = await prisma.member.findMany({
      where: {
        user: { gymId }
      },
      include: {
        user: {
          include: {
            profile: true
          }
        },
        memberships: {
          include: {
            membershipPlan: true
          }
        }
      },
      orderBy: {
        joinDate: 'desc'
      }
    });

    return sendResponse(members);
  } catch (error: any) {
    return sendError(error);
  }
});

export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const gymId = user.gymId;
    if (!gymId) {
      throw new Error('Not authorized to add members (no gym association)');
    }

    const body = await req.json();
    const { firstName, lastName, email, phone, medicalNotes, membershipPlanId } = body;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return sendError('Email is already taken', 400);
    }

    const defaultPasswordHash = await bcrypt.hash('member123', 10);

    // Get gym's branch
    const branch = await prisma.branch.findFirst({ where: { gymId } });
    if (!branch) {
      throw new Error('No branch found for your gym. Please seed the database.');
    }

    const newMember = await prisma.$transaction(async (tx) => {
      // 1. Create User
      const newUser = await tx.user.create({
        data: {
          gymId,
          branchId: branch.id,
          email,
          phone,
          passwordHash: defaultPasswordHash,
          role: 'MEMBER',
          status: 'ACTIVE',
          profile: {
            create: {
              firstName,
              lastName,
            }
          },
          member: {
            create: {
              medicalNotes,
            }
          }
        },
        include: {
          member: true,
          profile: true
        }
      });

      // 2. Attach membership if membershipPlanId is provided
      if (membershipPlanId && newUser.member) {
        const plan = await tx.membershipPlan.findUnique({
          where: { id: membershipPlanId }
        });

        if (plan) {
          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + plan.durationDays);

          const membership = await tx.memberMembership.create({
            data: {
              memberId: newUser.member.id,
              membershipPlanId: plan.id,
              startDate,
              endDate,
              status: 'ACTIVE',
            }
          });

          // Log payment
          await tx.payment.create({
            data: {
              memberId: newUser.member.id,
              membershipId: membership.id,
              amount: plan.price,
              paymentMethod: 'CASH',
              paymentStatus: 'SUCCESS',
              paidAt: startDate,
              transactionId: `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            }
          });
        }
      }

      return newUser;
    });

    return sendResponse(newMember, 201, 'Member created successfully');
  } catch (error: any) {
    return sendError(error);
  }
});
